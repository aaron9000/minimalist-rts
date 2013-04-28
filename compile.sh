#consts
LIBRARY_COMBINE_PATH="build/combined/libraryCombined.js"
LIBRARY_MINIFY_PATH="build/minified/libraryMinified.js"
APP_COMBINE_PATH="build/combined/appCombined.js"
APP_MINIFY_PATH="build/minified/appMinified.js"
APP_SCRIPT_FOLDER="scripts/app/"

#set globals
PRODUCT_FOLDER="products/develop/"
RELEASE=0
if [ "$1" == "release" ];
then
	PRODUCT_FOLDER="products/release/"
	RELEASE=1
fi

#ensure folders exist
echo "-----------creating folders------------"
python combiner.py prep

#copy resources
echo "-----------copying resources-----------"
copyStyles="cp -R styles ""$PRODUCT_FOLDER"
eval $copyStyles
copyImages="cp -R images ""$PRODUCT_FOLDER"
eval $copyImages
copySounds="cp -R sounds ""$PRODUCT_FOLDER"
eval $copySounds

#lint individual files
echo "----------linting app scripts----------"
for entry in "$APP_SCRIPT_FOLDER"/*
do
  jshint $entry
done

#combine, copy, and preprocess scripts
if [ $RELEASE -eq 1 ]
then
    echo "----------combining scripts------------"
	python combiner.py release strip phase1
fi

#minify scripts
if [ $RELEASE -eq 1 ]
then
	echo "-----------minifying scripts-----------"
	cmd="uglifyjs ""$APP_COMBINE_PATH"" --mangle --compress -o ""$APP_MINIFY_PATH"
	eval $cmd
	cmd="uglifyjs ""$LIBRARY_COMBINE_PATH"" --mangle --compress -o ""$LIBRARY_MINIFY_PATH"
	eval $cmd
fi

#get things into product folder
echo "----preprocessing markup and scripts---"
if [ $RELEASE -eq 1 ]
then
	python combiner.py release strip phase2
else
	python combiner.py develop nostrip phase2
fi

#open the page
if [ $RELEASE -eq 0 ]
then
    echo "-------------open page-----------------"
    open="open $PRODUCT_FOLDER""default.html"
    eval $open
fi

echo "----------------done-------------------"
