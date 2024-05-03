module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("src/scss");
    eleventyConfig.addPassthroughCopy("src/public");
	eleventyConfig.setBrowserSyncConfig({
		files: './_build/css/**/*.css'
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
