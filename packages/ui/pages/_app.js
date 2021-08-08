import "../styles/globals.css";
import "../styles/globals.css";
import { userDataState, userSessionState, useConnect } from "../lib/auth";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { Connect } from "@syvita/connect-react";

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
