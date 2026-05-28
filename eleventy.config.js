import path from "node:path";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import postcssImport from "postcss-import";
import cssnano from "cssnano";
import syntaxHighlighting from "@11ty/eleventy-plugin-syntaxhighlight";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import pluginTOC from "eleventy-plugin-toc";
import Image, { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

export default function (eleventyConfig) {
  const isDev = process.env.ELEVENTY_RUN_MODE === "serve";

  // Set directories
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setOutputDirectory("dist");
  eleventyConfig.setIncludesDirectory("_includes");
  eleventyConfig.setLayoutsDirectory("_layouts");

  eleventyConfig.ignores.add("src/_styles/**");

  // Add public folder
  if (isDev) {
    // Allow all files for development and cms
    eleventyConfig.addPassthroughCopy("src/assets");
  } else {
    // Ignore images since they will be transformed
    eleventyConfig.addPassthroughCopy("src/assets/**/*.!(png|jpg|jpeg)");
  }

  // Add icons
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({
    "src/site.webmanifest": "site.webmanifest",
  });

  // Export sanitize css
  eleventyConfig.addPassthroughCopy({
    "node_modules/sanitize.css/sanitize.css": "sanitize.css",
  });

  // Replace default markdown parser
  const markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  }).use(markdownItAnchor);

  eleventyConfig.setLibrary("md", markdownLibrary);

  // Add postcss parsing
  eleventyConfig.addTemplateFormats("css");
  eleventyConfig.addExtension("css", {
    outputFileExtension: "css",
    compileOptions: {
      cache: false,
    },
    compile: async (inputContent, inputPath) => {
      try {
        const result = await postcss([
          postcssImport,
          autoprefixer,
          cssnano,
        ]).process(inputContent, {
          from: inputPath,
        });
        return async () => result.css;
      } catch (err) {
        console.error("PostCSS error:", err);
      }
    },
  });

  // Shortcode for transforming open graph meta tags
  eleventyConfig.addLiquidShortcode("ogImage", async function (src) {
    if (!src) return "";

    // Check if the image is a remote web URL
    const isRemote = src.startsWith("http://") || src.startsWith("https://");

    // If it is a local absolute path, prepend 'src'.
    let targetSrc = src;
    if (!isRemote && src.startsWith("/")) {
      targetSrc = path.join("src", src);
    }

    let metadata = await Image(targetSrc, {
      widths: [1200],
      formats: ["jpeg"],
      outputDir: "./dist/assets/images/optimized/",
      urlPath: "/assets/images/optimized/",
    });

    return metadata.jpeg[metadata.jpeg.length - 1].url;
  });

  // Add read time calculation
  eleventyConfig.addFilter("readTime", (content) => {
    const wordsPerMinute = 200;
    const textOnly = content.replace(/(<([^>]+)>)/gi, "");
    const wordCount = textOnly.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);

    return minutes === 1 ? "1 min read" : `${minutes} min read`;
  });

  // Add plugins
  eleventyConfig.addPlugin(syntaxHighlighting);
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    extensions: "html",
    formats: ["avif", "webp", "jpeg"],
    widths: [400, 800, 1600, 2400],
    urlPath: "/assets/images/optimized/",
    outputDir: "./dist/assets/images/optimized/",
    defaultAttributes: {
      loading: "lazy",
      decoding: "async",
      sizes: "(max-width: 800px) 100vw, 800px",
    },
  });

  eleventyConfig.addPlugin(feedPlugin, {
    outputPath: "/thoughts/feed.xml",
    collection: {
      name: "thoughts",
      limit: 10,
    },
    metadata: {
      language: "en",
      title: "Thinking of thoughts",
      subtitle: "Writing about whatever crosses my mind at the moment.",
      base: "https://mkf.dev/",
      author: {
        name: "MorganF",
        email: "morgan@mkf.dev",
      },
    },
  });
  eleventyConfig.addPlugin(pluginTOC, {
    tags: ["h2", "h3"],
    wrapper: "nav",
    wrapperClass: "post-toc",
  });
}
