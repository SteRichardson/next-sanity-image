'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var react = require('react');
var imageUrlBuilder = require('@sanity/image-url');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var imageUrlBuilder__default = /*#__PURE__*/_interopDefaultLegacy(imageUrlBuilder);

const DEFAULT_BLUR_UP_IMAGE_WIDTH = 64;
const DEFAULT_BLUR_UP_IMAGE_QUALITY = 30;
const DEFAULT_BLUR_UP_AMOUNT = 50;
const DEFAULT_FALLBACK_IMAGE_QUALITY = 75;
const DEFAULT_BLUR_IMAGE_BUILDER = (imageUrlBuilder, options) => {
    return imageUrlBuilder
        .width(options.width || DEFAULT_BLUR_UP_IMAGE_WIDTH)
        .quality(options.quality || DEFAULT_BLUR_UP_IMAGE_QUALITY)
        .blur(options.blurAmount || DEFAULT_BLUR_UP_AMOUNT)
        .fit('clip');
};
const DEFAULT_IMAGE_BUILDER = (imageUrlBuilder, options) => {
    const result = imageUrlBuilder
        .quality(options.quality || DEFAULT_FALLBACK_IMAGE_QUALITY)
        .fit('clip');
    if (options.width !== null) {
        return result.width(options.width);
    }
    return result;
};
function getSanityRefId(image) {
    if (typeof image === 'string') {
        return image;
    }
    const obj = image;
    const ref = image;
    const img = image;
    if (typeof image === 'string') {
        return image;
    }
    if (obj.asset) {
        return obj.asset._ref || obj.asset._id;
    }
    return ref._ref || img._id || '';
}
function getImageDimensions(id) {
    const dimensions = id.split('-')[2];
    const [width, height] = dimensions.split('x').map((num) => parseInt(num, 10));
    const aspectRatio = width / height;
    return { width, height, aspectRatio };
}
function getCroppedDimensions(image, baseDimensions) {
    const crop = image.crop;
    if (!crop) {
        return baseDimensions;
    }
    const { width, height } = baseDimensions;
    const croppedWidth = width * (1 - (crop.left + crop.right));
    const croppedHeight = height * (1 - (crop.top + crop.bottom));
    return {
        width: croppedWidth,
        height: croppedHeight,
        aspectRatio: croppedWidth / croppedHeight
    };
}
function useNextSanityImage(sanityClient, image, options = {}) {
    const enableBlurUp = options.enableBlurUp === undefined ? true : options.enableBlurUp;
    const blurAmount = options.blurUpAmount || null;
    const blurUpImageQuality = options.blurUpImageQuality || null;
    const blurUpImageWidth = options.blurUpImageWidth || null;
    const blurUpImageBuilder = options.blurUpImageBuilder || DEFAULT_BLUR_IMAGE_BUILDER;
    const imageBuilder = options.imageBuilder || DEFAULT_IMAGE_BUILDER;
    return react.useMemo(() => {
        if (!image) {
            return null;
        }
        // If the image has an alt text but does not contain an actual asset, the id will be
        // undefined: https://github.com/bundlesandbatches/next-sanity-image/issues/14
        const id = image ? getSanityRefId(image) : null;
        if (!id) {
            return null;
        }
        const originalImageDimensions = getImageDimensions(id);
        const croppedImageDimensions = getCroppedDimensions(image, originalImageDimensions);
        const loader = ({ width, quality }) => {
            return (imageBuilder(imageUrlBuilder__default["default"](sanityClient).image(image).auto('format'), {
                width,
                originalImageDimensions,
                croppedImageDimensions,
                quality: quality || null
            }).url() || '');
        };
        const baseImgBuilderInstance = imageBuilder(imageUrlBuilder__default["default"](sanityClient).image(image).auto('format'), {
            width: null,
            originalImageDimensions,
            croppedImageDimensions,
            quality: null
        });
        const width = baseImgBuilderInstance.options.width ||
            (baseImgBuilderInstance.options.maxWidth
                ? Math.min(baseImgBuilderInstance.options.maxWidth, croppedImageDimensions.width)
                : croppedImageDimensions.width);
        const height = baseImgBuilderInstance.options.height ||
            (baseImgBuilderInstance.options.maxHeight
                ? Math.min(baseImgBuilderInstance.options.maxHeight, croppedImageDimensions.height)
                : Math.round(width / croppedImageDimensions.aspectRatio));
        const props = {
            loader,
            src: baseImgBuilderInstance.url(),
            width,
            height
        };
        if (enableBlurUp) {
            const blurImgBuilderInstance = blurUpImageBuilder(imageUrlBuilder__default["default"](sanityClient).image(image).auto('format'), {
                width: blurUpImageWidth,
                originalImageDimensions,
                croppedImageDimensions,
                quality: blurUpImageQuality,
                blurAmount: blurAmount
            });
            return {
                ...props,
                blurDataURL: blurImgBuilderInstance.url(),
                placeholder: 'blur'
            };
        }
        return { ...props, placeholder: 'empty' };
    }, [
        blurAmount,
        blurUpImageBuilder,
        blurUpImageQuality,
        blurUpImageWidth,
        enableBlurUp,
        imageBuilder,
        image,
        sanityClient
    ]);
}

exports.useNextSanityImage = useNextSanityImage;
