//Idea came from this repo: https://github.com/brookslybrand/next-nested-layouts

import "../styles/globals.css";
import "react-loading-skeleton/dist/skeleton.css";

import { useEffect } from "react";
import Head from "next/head";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { SWRConfig } from "swr";
import posthog from "posthog-js";

import { TipProvider } from "components/atoms/Tooltip/tooltip";

import changeCapitalization from "lib/utils/change-capitalization";
import apiFetcher from "lib/hooks/useSWR";
import { initiateAnalytics } from "lib/utils/analytics";
import { supabase } from "lib/utils/supabase";

type ComponentWithPageLayout = AppProps & {
  Component: AppProps["Component"] & {
    PageLayout?: React.ComponentType<any>;
  };
};

function MyApp({ Component, pageProps }: ComponentWithPageLayout) {
  const router = useRouter();

  // From documentation on using Posthog with Next.js: https://posthog.com/docs/integrate/third-party/next-js
  useEffect(() => {
    initiateAnalytics();

    const handleRouteChange = () => posthog.capture("$pageview");
    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  const { filterName, toolName } = router.query;

  function localStorageProvider() {
    if (typeof window !== "undefined") {
      console.log("You are on the browser");

      // When initializing, we restore the data from `localStorage` into a map.
      const map: Map<string, string> = new Map(JSON.parse(localStorage.getItem("app-cache") || "[]"));

      // Before unloading the app, we write back all the data into `localStorage`.
      window.addEventListener("beforeunload", () => {
        const appCache = JSON.stringify(Array.from(map.entries()));
        try {
          localStorage.setItem("app-cache", appCache);
        } catch (error) {
          if (error instanceof Error && error.name === "QuotaExceededError")
            return console.warn("⚠ local storage limit exceeded ⚠");

          throw error;
        }
      });

      // We still use the map for write & read for performance.
      return map;
    } else {
      console.log("You are on the server");
      // 👉️ can't use localStorage

      return new Map();
    }
  }

  const title = `Open Sauced Insights ${filterName ? ` - ${changeCapitalization(filterName!.toString(), true)}` : ""} ${
    toolName ? ` / ${changeCapitalization(toolName.toString(), true)}` : ""
  }`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:url" content="https://insights.opensauced.pizza" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="OpenSauced Insights" />
        <meta name="twitter:card" content="summary" />
        <meta
          property="og:description"
          content="The open-source intelligence platform for developers and maintainers. Unlock the power of open source with project insights by the slice."
        />
        <meta property="og:image" content="/social-card.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <SWRConfig
        value={{
          revalidateOnFocus: false,
          fetcher: apiFetcher,
          provider: localStorageProvider
        }}
      >
        <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
          <TipProvider>
            {Component.PageLayout ? (
              <Component.PageLayout>
                <Component {...pageProps} />
              </Component.PageLayout>
            ) : (
              <Component {...pageProps} />
            )}
          </TipProvider>
        </SessionContextProvider>
      </SWRConfig>
    </>
  );
}

export default MyApp;
