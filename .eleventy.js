module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("src/public");
    eleventyConfig.addPassthroughCopy("src/fonts");
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
