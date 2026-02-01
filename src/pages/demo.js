import React from 'react';
import Head from 'next/head';
import ReleaseNotesComposer from '../components/ReleaseNotesComposer';

const DemoPage = () => {
  return (
    <>
      <Head>
        <title>Release Notes Composer - AI Tools Suite Demo</title>
        <meta name="description" content="Demo of the AI-powered Release Notes Composer that automatically generates customer-ready release notes from GitHub PRs and JIRA tickets" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <ReleaseNotesComposer />
      </main>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
            Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
          background-color: #f5f5f5;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        main {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px 0;
        }
      `}</style>
    </>
  );
};

export default DemoPage;
