import postcss from "postcss";
import autoprefixer from "autoprefixer";
import postcssImport from "postcss-import";
import cssnano from "cssnano";
import syntaxHighlighting from "@11ty/eleventy-plugin-syntaxhighlight";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import pluginTOC from "eleventy-plugin-toc";

export default function (eleventyConfig) {
  // Set directories
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setOutputDirectory("dist");
  eleventyConfig.setIncludesDirectory("_includes");
  eleventyConfig.setLayoutsDirectory("_layouts");

  eleventyConfig.ignores.add("src/_styles/**");

  // Add public folder
  eleventyConfig.addPassthroughCopy("src/assets");

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
