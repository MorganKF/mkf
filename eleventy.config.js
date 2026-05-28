import postcss from "postcss";
import autoprefixer from "autoprefixer";
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

  // Add public folder
  eleventyConfig.addPassthroughCopy("src/assets");

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
    compile: async (inputContent, inputPath) => {
      try {
        const result = await postcss([autoprefixer]).process(inputContent, {
          from: inputPath,
        });
        return async () => result.css;
      } catch (err) {
        console.error("PostCSS error:", err);
      }
    },
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
