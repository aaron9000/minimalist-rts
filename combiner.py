#!/usr/bin/env python
import sys
import os
import re

GENERATED_JS = "/* generated script */\n"
GENERATED_HTML = "<!-- generated html -->\n"

#look for a specific folder structure on disk
#if it's not there, create it
def createFolder(folder):
    components = os.path.split(folder)
    path = ""
    for component in components:
        path = os.path.join(path, component)
        pathToTest = path
        if pathToTest == "":
            pathToTest = folder
        if os.path.isdir(pathToTest) == 0:
            os.mkdir(pathToTest)

#get javascript import statement from filename
def getImportString(filePath):
    if RELEASE:
        return "<script language=\"JavaScript\" src=\"" + filePath + "\"></script>\n"
    else:
        return "<script language=\"JavaScript\" src=\"" + "scripts/" + filePath + "\"></script>\n"

#build script import string from contents of directory
def getScriptsString():
    scriptsString = ""
    if RELEASE:
        scriptsString = getImportString("compiled.js")
    else:
        for folder in [LIBRARY_FOLDER, APP_FOLDER]:
            orderedFilenames = []
            filenames = os.listdir(folder)
            unorderedFilenames = filterFiles(filenames, folder, ".js")
            orderedFilenames = getOrderedFiles(folder, unorderedFilenames)

            for filename in orderedFilenames:
                if filenames.count(filename) > 0:
                    scriptsString += getImportString(filename)
            for filename in unorderedFilenames:
                if filenames.count(filename) > 0:
                    scriptsString += getImportString(filename)

    return scriptsString

#<!-- scripts --> tag replacement
def scriptTagReplace(string):
    scriptTag = "<!--scripts-->"
    return replaceTagInString(string, scriptTag, getScriptsString(), GENERATED_HTML)

#/*debug*/ tag replacement
#_debugMode = VALUE;
def debugTagReplace(string):
    debugTag = "/\*debug\*/"
    replaceString = "_debugMode = true;\n"
    if RELEASE:
        replaceString = "_debugMode = false;\n"

    replaceString = replaceString
    return replaceTagInString(string, debugTag, replaceString, GENERATED_JS)

#/*sounds*/ tag replacement
def soundsTagReplace(string):
    soundsTag = "/\*sounds\*/"
    return replaceTagInString(string, soundsTag, soundsToReplace(), GENERATED_JS)

#/*images*/ tag replacement
def imagesTagReplace(string):
    imagesTag = "/\*images\*/"
    return replaceTagInString(string, imagesTag, imagesToReplace(), GENERATED_JS)

#generate _sound object from images folder
#_sounds = {};
#_sounds.Qux = "sounds/Qux.wav";
#_sounds.Bar = "sounds/Bar.wav";
#_sounds.Foo = "sounds/Foo.wav";
def soundsToReplace():
    string = "_sounds = {};" + "\n"
    folder = "sounds/"
    fileExtension = ".wav"
    files = os.listdir(folder)
    filteredFiles = filterFiles(files, folder, fileExtension)
    for file in filteredFiles:
        noExtension = file.replace(fileExtension, "")
        line = "_sounds." + noExtension + " = \"" + os.path.join(folder, file) + "\";"
        string += line + "\n"

    return string

#generate _image object from images folder
#_images = {};
#_images.Qux = "images/Qux.png";
#_images.Bar = "images/Bar.png";
#_images.Foo = "images/Foo.png";
def imagesToReplace():
    string = "_images = {};" + "\n"
    folder = "images/"
    fileExtension = ".png"
    files = os.listdir(folder)
    filteredFiles = filterFiles(files, folder, fileExtension)
    for file in filteredFiles:
        noExtension = file.replace(fileExtension, "")
        line = "_images." + noExtension + " = \"" + os.path.join(folder, file) + "\";"
        string += line + "\n"

    return string

#replace a single occurrence of token within string
def replaceTagInString(string, tag, replacement, replacementPadding):
    replacement = replacementPadding + replacement + replacementPadding
    tagOccurences = [(a.start(), a.end()) for a in list(re.finditer(tag, string))]
    count = len(tagOccurences)
    if count == 1:
        left = tagOccurences[0][0]
        right = tagOccurences[0][1]
        return string[0:left] + replacement + string[right:len(string)]

    return string

#/*strip*/ section removal
def stripSectionRemoval(string):
    stripTag = "/\*strip\*/"
    tagOccurences = [(a.start(), a.end()) for a in list(re.finditer(stripTag, string))]
    count = len(tagOccurences)

    if (count == 0):
        return string

    if (count % 2 == 0):
        strippedString = ""
        firstOuter = 0
        lastOuter = 0
        for i in range(0, count):
            if i % 2 == 0:
                firstOuter = tagOccurences[i][0]
                strippedString += string[lastOuter:firstOuter]
            else:
                lastOuter = tagOccurences[i][1]

        #include trailing chars
        strippedString += string[lastOuter:len(string)]
        return strippedString
    else:
        print "uneven \"" + stripTag + "\" tag counts. no stripping performed"
        return string

#tag replacement & stripping
def preprocess(scriptString):

    #debug mode value
    scriptString = debugTagReplace(scriptString)

    #do stripping
    if STRIP:
        scriptString = stripSectionRemoval(scriptString)

    #add image dictionary
    scriptString = imagesTagReplace(scriptString)

    #add sound dictionary 
    scriptString = soundsTagReplace(scriptString)

    return scriptString

#helper for getting filtered lists of files
def filterFiles(arrayOfFiles, folder, extension):
    filteredFiles = []
    for file in arrayOfFiles:
        if file.endswith(extension):
            path = os.path.join(folder, file);
            if os.path.isfile(path):
                filteredFiles.append(file)

    return filteredFiles

#generate string representation of a list of files
def getCombinedFileString(arrayOfFiles, folder):
    scriptString = ""
    filteredFiles = filterFiles(arrayOfFiles, folder, ".js")
    for file in filteredFiles:
        path = os.path.join(folder, file);
        f = open(path)
        fileString = f.read() + "\n"
        scriptString += fileString
        f.close()

    #tag replacement & stripping
    scriptString = preprocess(scriptString)

    return scriptString

#returns the list of ordered files and removes associated entries within the unordered files array
def getOrderedFiles(folder, unorderedFiles):
    orderedFiles = []
    path = os.path.join(folder, "scriptOrdering.txt")
    if os.path.isfile(path):
        f = open(path)
        for line in f:
            filename = line.replace("\n", "")
            orderedFiles.append(filename)
            if unorderedFiles.count(filename) > 0:
                unorderedFiles.remove(filename)
        f.close()

    #defaults
    for line in ["libraryCombined.js", "appCombined.js", "libraryMinified.js", "appMinified.js"]:
        orderedFiles.append(line)
        if unorderedFiles.count(line) > 0:
            unorderedFiles.remove(line)

    return orderedFiles

#combine a list of javascript files and write to file
def combineFiles(files, outputFile, folder):
    #unordered files
    #assume all unordered to start
    unorderedFiles = []
    for file in files:
        unorderedFiles.append(file)

    #get desired ordering
    #remove explicitly ordered files from unordered list
    orderedFiles = getOrderedFiles(folder, unorderedFiles)

    #get string blobs and combine them
    orderedBlob = getCombinedFileString(orderedFiles, folder) + "\n"
    unorderedBlob = getCombinedFileString(unorderedFiles, folder)
    scriptString = orderedBlob + unorderedBlob

    #write file
    fo = open(outputFile, "wb")
    fo.write(scriptString)
    fo.close()

#combine an entire folder of scripts
def combineFolder(folder, outputFile):

    #get list of files to include
    files = os.listdir(folder)
    filteredFiles = filterFiles(files, folder, ".js")

    #combine contents of files and write to disc
    combineFiles(filteredFiles, outputFile, folder)

#copy scripts
def copyScripts(folder, outputFolder):
#get list of files to include
    files = os.listdir(folder)
    filteredFiles = filterFiles(files, folder, ".js")
    #combine contents of files and write to disc
    for file in filteredFiles:
        #open file and do tag replacement
        f = open(os.path.join(folder, file))
        scriptString = f.read()
        scriptString = preprocess(scriptString)
        f.close()

        #write file into output folder
        fo = open(os.path.join(outputFolder, file), "wb")
        fo.write(scriptString)
        fo.close()

#copy markup
def copyMarkup(folder, outputFolder):
    #get list of files to include
    files = os.listdir(folder)
    filteredFiles = filterFiles(files, folder, ".html")

    #combine contents of files and write to disc
    for file in filteredFiles:
        #open file and do tag replacement
        f = open(os.path.join(folder, file))
        markupString = f.read()
        markupString = scriptTagReplace(markupString)
        f.close()

        #write file into output folder
        fo = open(os.path.join(outputFolder, file), "wb")
        fo.write(markupString)
        fo.close()

#delete contents of folder
def deleteFilesInFolder(folder, extension):
    files = os.listdir(folder)
    for file in files:
        if file.endswith(extension):
            try:
                os.remove(os.path.join(folder, file))
            except Exception,e:
                print e


#find existence of input argument
def scan(arg):
    return arg in sys.argv

#set globals
STRIP = scan("strip")
PHASE2 = scan("phase2")
RELEASE = scan("release")
PREP = scan("prep")

#consts
MARKUP_FOLDER = "markup"
MINIFY_FOLDER = "build/minified"
COMBINE_FOLDER = "build/combined"
LIBRARY_FOLDER = "scripts/library"
APP_FOLDER = "scripts/app"
RELEASE_FOLDER = "products/release"
DEVELOP_FOLDER = "products/develop"
PRODUCT_FOLDER = ""
if RELEASE:
    PRODUCT_FOLDER = RELEASE_FOLDER
else:
    PRODUCT_FOLDER = DEVELOP_FOLDER
PRODUCT_SCRIPTS = os.path.join(PRODUCT_FOLDER, "scripts")

#make sure the folder structure exists
if PREP:
    createFolder(LIBRARY_FOLDER)
    createFolder(APP_FOLDER)
    createFolder(MARKUP_FOLDER)
    createFolder(MINIFY_FOLDER)
    createFolder(COMBINE_FOLDER)
    createFolder(DEVELOP_FOLDER)
    createFolder(RELEASE_FOLDER)
    createFolder(PRODUCT_SCRIPTS)
    sys.exit(1)

#which phase?
if PHASE2:
    if RELEASE:
        deleteFilesInFolder(PRODUCT_FOLDER, ".js")
        copyMarkup(MARKUP_FOLDER, PRODUCT_FOLDER)
        combineFolder(MINIFY_FOLDER, os.path.join(PRODUCT_FOLDER, "compiled.js"))
    else:
        deleteFilesInFolder(PRODUCT_SCRIPTS, ".js")
        copyMarkup(MARKUP_FOLDER, PRODUCT_FOLDER)
        copyScripts(APP_FOLDER, PRODUCT_SCRIPTS)
        copyScripts(LIBRARY_FOLDER, PRODUCT_SCRIPTS)
else:
    if RELEASE:
        combineFolder(APP_FOLDER, os.path.join(COMBINE_FOLDER, "appCombined.js"))
        combineFolder(LIBRARY_FOLDER, os.path.join(COMBINE_FOLDER, "libraryCombined.js"))

#exit successfully
sys.exit(1)




