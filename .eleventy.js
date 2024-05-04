module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("src/_includes/public");
    eleventyConfig.addPassthroughCopy("src/_includes/fonts");
	eleventyConfig.setBrowserSyncConfig({
		files: './_build/_includes/css/**/*.css'
	});
    return {
        dir: {
            input: "src",
            includes: "_includes",
            data: "_data",
            output: "_build"
        }
    }
}
