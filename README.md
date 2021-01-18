# next-sanity-image

Utility for using responsive images hosted on the [Sanity.io CDN](https://sanity.io) with the [Next.js image component](https://nextjs.org/docs/api-reference/next/image). This library:
* Implements the [loader callback](https://nextjs.org/docs/api-reference/next/image#loader) to resolve the corresponding Sanity CDN URL's.
* Respects the [image sizes](https://nextjs.org/docs/basic-features/image-optimization#image-sizes) and [device sizes](https://nextjs.org/docs/basic-features/image-optimization#device-sizes) as specified in your Next config.
* Allows transforming the image using the [@sanity/image-url builder](https://www.npmjs.com/package/@sanity/image-url).
* Automatically sets the width and the height of the Next image component to the corresponding aspect ratio.
* Is fully typed and exposes [relevant types](#types).


## Installation

```
npm install --save next-sanity-image
```

This library also expects you to pass in a [SanityClient instance](https://www.npmjs.com/package/@sanity/client), if you haven't installed this already:

```
npm install --save @sanity/client
```


## Usage

```jsx
import sanityClient from '@sanity/client';
import Img from 'next/image';
import { useNextSanityImage } from 'next-sanity-image';

// If you use the same client on the server side for data fetching, be aware that you should not expose your API token.
// Make sure to omit NEXT_PUBLIC from the environment variable, like in the example below.
const configuredSanityClient = sanityClient({
	projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
	dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
	token: process.env.SANITY_TOKEN,
	useCdn: true
});

const Page = ({ mySanityData }) => (
	const imageProps = useNextSanityImage(
		configuredSanityClient,
		mySanityData.image
	);

	// It is highly recommended to set the sizes prop when the image is not the same size as the viewport.
	// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-sizes
	return (
		<Img {...imageProps} sizes="(max-width: 800px) 100vw, 800px" />
	);
);

// Replace this with your logic for fetching data from the Sanity API.
export const getServerSideProps = async function (context) {
	const { slug = '' } = context.query;

	const data = await configuredSanityClient.fetch(
		`{
			"mySanityData": *[_type == "mySanityType" && slug.current == $slug][0] {
				image
			}
		}`,
		{ slug }
	);

	return { props: data };
};

export default Page;
```


## API

### useNextSanityImage

React hook which handles generating a URL for each of the defined sizes in the [image sizes](https://nextjs.org/docs/basic-features/image-optimization#image-sizes) and [device sizes](https://nextjs.org/docs/basic-features/image-optimization#device-sizes) Next.js options.

#### sanityClient: [`SanityClient`](https://www.npmjs.com/package/@sanity/client)

Pass in a configured instance of the SanityClient, used for building the URL using the the [@sanity/image-url builder](https://www.npmjs.com/package/@sanity/image-url).

#### image: [`SanityImageSource`](https://www.npmjs.com/package/@sanity/image-url#imagesource)

A reference to a Sanity image asset, can be retrieved by using the Sanity API. You can pass in any asset that is also supported by the [image() method of @sanity/image-url](https://www.npmjs.com/package/@sanity/image-url#imagesource).

#### imageBuilder?: (`imageUrlBuilder:` [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage), `{ width: number, originalAspectRatio: number } : NextSanityImageBuilderOptions`) => [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage)

An optional function callback which allows you to customize the image using the [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage). This function is called for every entry in the [image sizes](https://nextjs.org/docs/basic-features/image-optimization#image-sizes) and [device sizes](https://nextjs.org/docs/basic-features/image-optimization#device-sizes), and is used to define the URL's outputted in the `srcSet` attribute of the image.

The passed parameters are an instance of [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage) and an options object containing `width` (the width for the current `srcSet` entry) and `originalAspectRatio` (the aspect ratio of the original image). You can transform the image by calling the available methods on [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage) and returning the instance from the function invocation.

Defaults to:
```javascript
const DEFAULT_IMAGE_URL_BUILDER = (imageUrlBuilder, options) => {
	return imageUrlBuilder.width(options.width).fit('clip');
};
```

For more information on how to use this, read the chapter on [Image transformations](#image-transformations).

#### Return value: NextSanityImageProps

```javascript
{
	src: string,
	width: number,
	height: number,
	layout: 'responsive',

	// https://nextjs.org/docs/api-reference/next/image#loader
	loader: ImageLoader
}
```


## Image transformations

Custom transformations can be made by implementing the `imageBuilder` callback function. Note that it's recommended to implement a memoized callback, either by implementing the function outside of the component function scope or by making use of [`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback). Otherwise the props will be recomputed for every render.

```jsx
//...

function myCustomImageBuilder(imageUrlBuilder, options) {
	return imageUrlBuilder
		.width(options.width)
		.blur(20)
		.flipHorizontal()
		.saturation(-100)
		.fit('clip');
}

const Page = ({ mySanityData }) => (
	const imageProps = useNextSanityImage(
		configuredSanityClient,
		mySanityData.image,
		myCustomImageBuilder
	);

	return (
		<Img {...imageProps} sizes="(max-width: 800px) 100vw, 800px" />
	);
);

//...
```

### Gotchas

* Because [next/image](https://nextjs.org/docs/api-reference/next/image) only renders a single `<img />` element with a `srcSet` attribute, the `width` and `height` prop being returned by the React hook is uniform for each size. Cropping an image is possible using the [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage), however you have to return an image with the same aspect ratio for each of the defined sizes. Art direction is currently not supported (both by [next/image](https://nextjs.org/docs/api-reference/next/image) and this library).
* Same as above goes for newer image formats, such as WebP. You can configure [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage) to return a WebP format, however this will not provide fallback functionality to a format supported by older browsers.

If the functionalities mentioned above are desired, please file an issue stating your specific use case so we can look at the desired behavior and possibilities.

## Types

The following types are exposed from the library:

* [`ImageUrlBuilder`](https://www.npmjs.com/package/@sanity/image-url#usage)
* `NextSanityImageProps`
* `NextSanityImageBuilderOptions`