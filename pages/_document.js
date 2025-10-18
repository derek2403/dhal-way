import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* DhalWay branding */}
        <title>DhalWay</title>
        <meta name="description" content="Multi-chain crypto payment preferences" />
        <link rel="icon" type="image/png" href="/icons/dhalway_1.png" />
        <link rel="apple-touch-icon" href="/icons/dhalway_1.png" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
