const syntax = require("@11ty/eleventy-plugin-syntaxhighlight")

module.exports = function(eleventyConfig) {
    eleventyConfig.addPlugin(syntax);
    eleventyConfig.addPassthroughCopy("src/.nojekyll");
    eleventyConfig.addPassthroughCopy("src/_includes/public");
    eleventyConfig.addPassthroughCopy("src/_includes/fonts");
	eleventyConfig.setBrowserSyncConfig({
		files: './docs/_includes/css/**/*.css'
	});
    
    const markdownIt = require("markdown-it");
    const markdownItAnchor = require("markdown-it-anchor");
    const markdownLib = markdownIt({ html: true }).use(markdownItAnchor);
    eleventyConfig.setLibrary("md", markdownLib);
    
    return {
        dir: {
            input: "src",
            includes: "_includes",
            data: "_data",
            output: "docs"
        }
    }
}
