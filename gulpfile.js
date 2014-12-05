var gulp = require('gulp');
var sass = require('gulp-sass');

var paths = {
	src: {
		sass: './scss/*.scss'
	},

	dest: {
		sass: './dist/css/',
		js: './dist/js/'
	}
};

gulp.task('sass', function () {
	gulp.src(paths.src.sass)
	.pipe(sass())
	.pipe(gulp.dest(paths.dest.sass));
});


gulp.task('default', ['sass']);