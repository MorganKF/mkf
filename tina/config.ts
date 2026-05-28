import { defineConfig } from "tinacms";

export default defineConfig({
  branch: "main",
  clientId: null,
  token: null,
  build: {
    outputFolder: "admin",
    publicFolder: "dist",
  },
  media: {
    tina: {
      mediaRoot: "assets/media",
      publicFolder: "src",
    },
  },
  search: {
    tina: {
      indexerToken: "dummy-token-for-local-dev",
      stopwordLanguages: ["eng"],
    },
    indexBatchSize: 100,
    maxSearchIndexFieldLength: 100,
  },
  schema: {
    collections: [
      {
        name: "thoughts",
        label: "Thoughts",
        path: "src/thoughts",
        format: "md",
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              const date = new Date().toISOString().split("T")[0];
              return `${date}-${
                values?.title
                  ?.toLowerCase()
                  .replace(/[^a-z0-9]/g, "-")
                  .replace(/-+/g, "-") || "new-post"
              }`;
            },
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          { type: "string", name: "subtitle", label: "Subtitle" },
          {
            type: "datetime",
            name: "date",
            label: "Publish Date",
            required: true,
          },
          { type: "image", name: "image", label: "Header Image" },
          { type: "string", name: "imageAlt", label: "Image Alt Text" },
          { type: "string", name: "tags", label: "Tags", list: true },
          { type: "rich-text", name: "body", label: "Body", isBody: true },
        ],
      },
    ],
  },
});
