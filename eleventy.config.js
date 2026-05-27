import postcss from "postcss";
import autoprefixer from "autoprefixer";

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
}
