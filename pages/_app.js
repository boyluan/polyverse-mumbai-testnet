import '../styles/globals.css'
import Link from 'next/link'

// For the UI: the main files that we will be working with, are in the 'Pages' directory
// The _app.js file is primarily used for the site's layout and navigation

// To start building out some of the UI, we need to begin with _app.js
// And we want to create  a layout
// We want to do a layout that is basically going to apply mainly our navigation
// The navigation is going to have a bit of styling
// And we're also going to be linking to other pages
// So in order to link to other pages in Next.js (contd. below):
// We need to go ahead and import the link component from 'next/link' - see Line 2 {{ import Link from 'next/link' }}

function MyApp({ Component, pageProps }) {
  // The next thing - instead of just returning the component that is rendered, we want to go ahead and wrap this in a <div>
  // And now we can apply some navigation
  // We'll be styling our navigation with tailwind.css
  return (
    <div>
      {/* border bottom, padding = 6 */}
      <nav className="border-b p-6">
        {/* We're using the classNames from tailwind.css */}
        <p className="text-4xl font-bold">Polyverse Marketplace</p>
        {/*
        // Next we're going to create a div to hold our links
        // We say flex, and margin-top 4
        // This will apply to all of the links that we're about to create here
        */}
        <div className="flex mt-4">
          {/* 1) The first link we want to create is a root link to go Home (a root link)
          // And we're setting the value to be 'Home'
          // That way we can navigate back to the home page from various pages
          */}
          <Link href="/">
            <a className="mr-6 text-purple-500">
              Home
            </a>
          </Link>
          {/* 2) The second link we're going to create, is for creating a new item  */}
          <Link href="/create-item">
            <a className="mr-6 text-purple-500">
              Sell Digital Asset
            </a>
          </Link>
          {/* 3) The third link/page is for viewing our own assets
          // Shows you the items that you've purchased
          */}
          <Link href="/my-assets">
            <a className="mr-6 text-purple-500">
              My Digital Assets
            </a>
          </Link>
          {/* 4) Then we're going to have this creator dashboard
          // This shows you the items that you've created
          // But it also shows you the items that you've sold in the marketplace
          */}
          <Link href="/creator-dashboard">
            <a className="mr-6 text-purple-500">
              Creator Dashboard
            </a>
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp
