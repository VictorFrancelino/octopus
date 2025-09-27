import { h } from "../h";
import { buildProps } from "./base";
import type { ImageProps } from "./types";

export const Image = (props: ImageProps) => {
  const {
    src,
    alt,
    width,
    height,
    loading = 'lazy',
    decoding = 'async',
    srcSet,
    sizes,
    class: cls,
    style,
    quality = 80,
    format = 'auto',
    placeholder,
    blurDataURL,
    role = 'img',
    ariaLabel,
    ...rest
  } = props;

  const numWidth = typeof width === "string" ? parseInt(width, 10) : width;
  const numHeight = typeof height === "string" ? parseInt(height, 10) : height
  const numQuality = typeof quality === "string" ? parseInt(quality, 10) : quality

  const optimizeImageUrl = (imageUrl: string): string => {
    if (!imageUrl.startsWith("http")) return imageUrl;

    try {
      const url = new URL(imageUrl)

      if (numQuality < 100 && !url.searchParams.has("q")) {
        url.searchParams.set("q", numQuality.toString())
      }

      if (format !== "auto" && !url.searchParams.has("fm")) {
        url.searchParams.set("fm", format)
      }

      if (numWidth && !url.searchParams.has("w")) {
        url.searchParams.set("w", numWidth.toString())
      }

      if (numHeight && !url.searchParams.has("h")) {
        url.searchParams.set("h", numHeight.toString())
      }

      return url.toString()
    } catch (error) {
      return imageUrl
    }
  }

  const optimizedSrc = optimizeImageUrl(src)

  const finalProps = buildProps({
    src: optimizedSrc,
    alt,
    width: numWidth?.toString(),
    height: numHeight?.toString(),
    loading,
    decoding,
    srcset: srcSet,
    sizes,
    class: cls,
    style,
    role,
    ...(ariaLabel && { 'aria-label': ariaLabel }),
    ...rest,
  })

  if (placeholder === "blur" && blurDataURL) {
    const currentStyle = finalProps.style || {}

    if (typeof currentStyle === "object") {
      finalProps.style = {
        backgroundImage: `url(${blurDataURL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        ...currentStyle,
      }
    } else if (typeof currentStyle === "string") {
      finalProps.style = `background-image: url(${blurDataURL}); background-size: cover; background-position: center; ${currentStyle}`;
    }
  }

  // Layout shift prevention (usar valores convertidos)
  if (numWidth && numHeight) {
    const currentStyle = finalProps.style || {};

    if (typeof currentStyle === 'object') {
      finalProps.style = {
        width: `${numWidth}px`,
        height: `${numHeight}px`,
        ...currentStyle
      };
    } else if (typeof currentStyle === 'string') {
      finalProps.style = `width: ${numWidth}px; height: ${numHeight}px; ${currentStyle}`;
    }
  }

  return h('img', finalProps);
};
