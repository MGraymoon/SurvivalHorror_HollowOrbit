//=============================================================================
// TN_DiagonalSpriteGenerator.js（4方向ホコグラから8方向画像を自動生成するプラグイン）
//=============================================================================
/*:
 * @plugindesc 【DLC Asset】It generates all the character pngs with diagonal diffs from the character folder.
 * @author terunon's Lab
 * @version 1.00
 * @target MZ
 * @url https://twitter.com/trinitroterunon
 *
 * @param bodyRate
 * @text Body ratio change: stretch rate
 * @desc If 1, it will be the same tall as default. The higher, the taller the body will be.
 * @default 1.42
 *
 * @param headRange
 * @text Body ratio change: head range
 * @desc The Y cood at the top of the character image is 0. It will not stretch up to this value.
 * @default 14
 * 
 * @param directory8dir
 * @text Destination folder
 * @desc The folder where it generates character images. If there is no folder, a folder will be created.
 * @default TN_DiagonalSpriteGenerator
 * 
 * @param dir8Filename
 * @text Diagonal image suffix
 * @desc If "_Q" for "$Hero.png", for example, "$Hero_Q.png" will be generated.
 * @default _Q
 *
 * @param layoutType
 * @text Generation layout
 * @desc If merged, 4-dir and diagonal characters will be on the same sheet. A "$" in a file name will be deleted.
 * @type select
 * @option 1.merge (same as PD_8DirDash.js)
 * @value 1
 * @option 2.generate seperately (same as other editors, like WOLF)
 * @value 2
 * @option 3.do not generate diagonal images
 * @value 3
 * @default 1
 *  
 * @help
 * 【How to use】-------------------------------------------------------
 * This plugin works for both RPG Maker MV and RPG Maker MZ.
 * Since it processes the whole "characters" folder, do not put files other
 * than png images in that folder.
 * 
 * If you run a play test with this plugin enabled, it will load the characters
 * folder and generate png images with diagonal diffs based on a unique
 * algorithm into "TN_DiagonalSpriteGenerator" folder within the project.
 *
 * After you picked up desired images, you can delete the folder.
 * 
 * Since this plugin is just an image converter and it has no functions to
 * handle the diagonal characters, use an 8-dir move plugin, such as
 * PD_8DirDash.js, to make use of the generated images.
 * 
 * Hope this plug-in will bring color to your game!
 * 
 * 【8-directionalization mechanism and areas of expertise】-------------
 * It uses an algorithm to scale a part of an image and generates diagonal
 * images in a pseudo-3D manner.
 * It's optimized for the RPG Maker's standard 4-dir characters.
 * While you can expect some degree of diagonal generation results even for
 * animals and large characters, boxy characters and characters that are too
 * wide for the image width will be somewhat uncomfortable.
 * (The same algorithm is used in my game "Absent Age", if you are interested.)
 * 
 * Please note that it is not possible to create an 8-dir image from a
 * specially arranged image (such as the default image $BigMonster.png, which
 * has 4 front-facing different characters as a 4-dir image).
 * 
 * 【Collaborative plugins】----------------------------------------------
 * ・TN_SpriteExtenderEx.js
 *  It generates character images with body ratio scaled.
 *  It's bundled with TN_SpriteExtender.js v2.0 (updated in 2023) or higher,
 *  which was released in 2019.
 * 　
 *  It can work with this plugin. When both are enabled, 8-dir character images
 *  with body ratio scaled will be generated.
 * 
 * ・PD_8DirDash.js (created by Shio_inu) bundled with this product
 *   https://plugin.fungamemake.com/archives/11005
 *   It supports 8-dir character images and enables 8-dir move.
 *   Although it was created for RPG Maker MV, it also supports MZ.
 * 
 *   The default parameters and the generation layout of this plugin assume
 *   PD_8DirDash.js.
 *   (Of course it can work with other 8-dir move plugins.)
 * 
 */

/*:ja
 * @plugindesc 【DLC素材】characterフォルダの全ホコグラpngのナナメ向き差分を生成します。
 * @author terunon's Lab
 * @version 1.00
 * @target MZ
 * @url https://twitter.com/trinitroterunon
 *
 * @param bodyRate
 * @text 頭身変更：引き伸ばし率
 * @desc 1でデフォルトと同じ頭身になります。高いほど頭身が上がります。
 * @default 1.42
 *
 * @param headRange
 * @text 頭身変更：頭の範囲
 * @desc 歩行グラフィック上端を0とし、ここに指定した値までは引き伸ばしを行いません。
 * @default 14
 * 
 * @param directory8dir
 * @text 出力先フォルダ
 * @desc 生成画像の保存先フォルダ名です。フォルダが無い場合は自動作成され、既に同名画像がある場合上書きされます。
 * @default TN_DiagonalSpriteGenerator
 * 
 * @param dir8Filename
 * @text ナナメ画像の接尾辞
 * @desc 例:「_Q」なら、$Hero.pngに対しナナメ画像 $Hero_Q.png が出力されます。
 * @default _Q
 *
 * @param layoutType
 * @text 出力レイアウト
 * @desc まとめると同キャラは4方向画像を上、ナナメ画像を下にして1シートにします。ビッグキャラ($で始まる)は$が消去されます。
 * @type select
 * @option 1.まとめる(PD_8DirDash.js準拠)
 * @value 1
 * @option 2.別々に出力する(WOLF等の外部エディタ準拠)
 * @value 2
 * @option 3.ナナメ画像を出力しない
 * @value 3
 * @default 1
 *  
 * @help
 * 【使用方法】-------------------------------------------------------
 * 本プラグインはRPGツクールMV・RPGツクールMZどちらでも動作します。
 * characterフォルダに対して一括処理を行うため、
 * ご使用の際はpng画像以外のファイルは入れないようにしてください。
 * 
 * 本プラグインをONにしてテストプレイを起動すると、characterフォルダを読み込み
 * プロジェクト内の「TN_DiagonalSpriteGenerator」フォルダに
 * 独自アルゴリズムでナナメを向かせた差分pngを生成します。
 *
 * 必要な画像を回収したらフォルダは削除いただいて差し支えございません。
 * 
 * 本プラグインは画像一括処理ツールであり、
 * 生成したナナメ画像をゲーム内で制御する機能はありませんので、ご使用の際は
 * PD_8DirDash.jsなどの8方向移動系プラグインを別途導入してください。
 * 
 * 本プラグインがあなたのゲームに彩りをもたらすことを願っています。
 * 
 * 【8方向化の仕組みと得意分野】---------------------------------------------
 * 画像の一部分を拡縮するアルゴリズムで、疑似3D的にナナメ画像を生成しています。
 * ツクールの標準4方向人型ホコグラに最適化しており、
 * 動物や大型キャラクターでもある程度ナナメに見える生成結果を見込めますが、
 * 箱型のキャラクターや、画像横幅が広すぎるキャラクターはやや苦手です。
 * （拙作ゲーム『アブセンテッドエイジ』で同アルゴリズムを採用していますので
 * 　ご興味あれば見てみてください）
 * 
 * 仕組み上、特殊な配置の画像（デフォルト素材の$BigMonster.pngのような
 * 正面向きだけを上下左右4方向で4体連ねている画像）からは
 * 正常に8方向画像を作れませんので、予めご了承ください。
 * 
 * 【連携プラグイン】-------------------------------------------------------
 * ・TN_SpriteExtenderEx.js（ホコグラの頭身を自在に変えるプラグインEX）
 * 　拡縮比率を指定し、頭身を変えたホコグラを一括自動生成できるプラグインです。
 * 　2019年発売のTN_SpriteExtender.js（ホコグラの頭身を自在に変えるプラグイン）
 * 　にver2.0アップデート(2023年)以降同梱されています。
 * 　
 * 　本プラグインと連携が可能で、
 * 　併用すると「頭身を変更した8方向画像」を生成できます。
 * 
 * ・PD_8DirDash.js（しおいぬ様）…製品にも同梱しています
 * 　https://plugin.fungamemake.com/archives/11005
 * 　8方向画像に対応したナナメ移動を可能にするプラグインです。
 * 　ツクールMV用プラグインですが、MZでも動作確認済みです。
 * 
 * 　本プラグインのデフォルトパラメータや出力レイアウトは
 * 　PD_8DirDash.jsを想定したものになっています。
 * （もちろん他の8方向移動プラグインでもご使用いただけます）
 * 
 */
var TN = TN || {};
(function() { 'use strict';
var parameters=PluginManager.parameters("TN_DiagonalSpriteGenerator");var directory=String(parameters["directory8dir"]);var suffix8Dir=String(parameters["dir8Filename"]);var layoutType=Number(parameters["layoutType"]);if(!directory)window.alert("TN_DiagonalSpriteGenerator.js Plugin Parameter Error: directory name (\u51fa\u529b\u5148\u30d5\u30a9\u30eb\u30c0) is empty.");if(!suffix8Dir)window.alert("TN_DiagonalSpriteGenerator.js Plugin Parameter Error: dir8 suffix (\u30ca\u30ca\u30e1\u753b\u50cf\u306e\u63a5\u5c3e\u8f9e) is empty.");
if(isNaN(layoutType))window.alert("TN_DiagonalSpriteGenerator.js Plugin Parameter Error: Layout Type Id (4x2\u30ad\u30e3\u30e9\u30b7\u30fc\u30c8\u306e\u30ca\u30ca\u30e1\u753b\u50cf\u306e\u51fa\u529b\u30ec\u30a4\u30a2\u30a6\u30c8) is NaN.");function SpriteProcessor(){throw new Error("This is a static class");}var SceneManagerUpdate=SceneManager.update;SceneManager.update=function(){SceneManagerUpdate.call(this);SpriteProcessor.update()};SpriteProcessor._initialized=false;
SpriteProcessor._setupFinished=false;SpriteProcessor.initialize=function(){if(this.isSpriteExtenderExActive())this._pathSpex=TN._SpriteExtenderEx.localDirectoryPathSpex();if(this.is8DirectionGeneratorActive())this._path8dir=this.localDirectoryPath8Dir();var fs=require("fs");fs.readdir("./img/characters/",function(err,files){if(err)throw err;this._files=files}.bind(this));this._initialized=true};SpriteProcessor.is8DirectionGeneratorActive=function(){return!!TN._8DirectionGenerator};
SpriteProcessor.isSpriteExtenderExActive=function(){return!!TN._SpriteExtenderEx};SpriteProcessor.setup=function(){this._files=this._files.filter(function(filename){return!ImageManager.isObjectCharacter(filename)});this._fileLength=this._files.length;this._processedIndex=0;this._setupFinished=true};SpriteProcessor.localDirectoryPath8Dir=function(){var path=require("path");var base=path.dirname(process.mainModule.filename);return path.join(base,directory+"/")};
SpriteProcessor.processBitmaps=function(){if(this._processedIndex===this._fileLength-1){this.endProcess();this._processedIndex++}else{var i=this._processedIndex;var l=this._fileLength;var bitmap=void 0;var filename=void 0;for(;i<l;i++){filename=this._files[i].replace(".png","");bitmap=ImageManager.loadCharacter(filename);if(bitmap.isReady())this.processBitmap(filename,bitmap);else return;this._processedIndex=i}}};
SpriteProcessor.endProcess=function(){var prefix="Done! \nCheck project folder: \n";var suffix="\n-----------------------------------------------"+"\nPress [OK] to exit this program. Have a good Gamemaking!"+"\n ('\u03c9')\u4e09";var pathes="  "+(this._pathSpex||"")+"\n  "+(this._path8dir||"");alert(prefix+pathes+suffix);SceneManager.terminate()};SpriteProcessor.refreshInformation=function(){document.title="Processing img/character ... "+(this._processedIndex+1)+"/"+this._fileLength+" - "+this._files[this._processedIndex]};
SpriteProcessor.update=function(){if(this._setupFinished){this.processBitmaps();this.refreshInformation()}else if(this._initialized){if(this._files)this.setup()}else this.initialize()};
SpriteProcessor.processBitmap=function(filename,bitmap){var htBitmap;if(this.isSpriteExtenderExActive()){htBitmap=TN._SpriteExtenderEx.processHeadsTallBitmap(filename,bitmap);this.saveToLocalFileSpex(filename,htBitmap)}else htBitmap=this.duplicateBitmap(bitmap);if(this.is8DirectionGeneratorActive())this.process8DirBitmapByLayouts(filename,htBitmap)};
SpriteProcessor.duplicateBitmap=function(bitmap){var w=bitmap.width;var h=bitmap.height;var newBitmap=new Bitmap(w,h);newBitmap.blt(bitmap,0,0,w,h,0,0);return newBitmap};
SpriteProcessor.process8DirBitmapByLayouts=function(filename,htBitmap){if(layoutType<3){var dir8Bitmap=this.process8DirBitmap(filename,htBitmap);if(layoutType===1)if(ImageManager.isBigCharacter(filename)){var renamed=filename.replace("$","");var compositeUpperBitmap=this.processCompositeUpperBigCharacterBitmap(htBitmap,dir8Bitmap);this.saveToLocalFile8dir(renamed+"_Upper"+suffix8Dir,compositeUpperBitmap);var compositeLowerBitmap=this.processCompositeLowerBigCharacterBitmap(htBitmap,dir8Bitmap);this.saveToLocalFile8dir(renamed+
"_Lower"+suffix8Dir,compositeLowerBitmap)}else{var compositeUpperBitmap$jscomp$0=this.processCompositeUpperCharacterBitmap(htBitmap,dir8Bitmap);this.saveToLocalFile8dir(filename+"_Upper"+suffix8Dir,compositeUpperBitmap$jscomp$0);var compositeLowerBitmap$jscomp$0=this.processCompositeLowerCharacterBitmap(htBitmap,dir8Bitmap);this.saveToLocalFile8dir(filename+"_Lower"+suffix8Dir,compositeLowerBitmap$jscomp$0)}else if(layoutType===2)this.saveToLocalFile8dir(filename+suffix8Dir,dir8Bitmap)}};
SpriteProcessor.processCompositeUpperBigCharacterBitmap=function(bitmap1,bitmap2){var w=bitmap1.width*4;var h=bitmap1.height;var bitmap=new Bitmap(w,h*2);bitmap.blt(bitmap1,0,0,w,h,0,0);bitmap.blt(bitmap2,0,0,w,h,0,h);return bitmap};SpriteProcessor.processCompositeLowerBigCharacterBitmap=function(bitmap1,bitmap2){var w=bitmap1.width*4;var h=bitmap1.height;var bitmap=new Bitmap(w,h*2);bitmap.blt(bitmap1,0,h,w,h,0,0);bitmap.blt(bitmap2,0,h,w,h,0,h);return bitmap};
SpriteProcessor.processCompositeUpperCharacterBitmap=function(bitmap1,bitmap2){var w=bitmap1.width;var h=bitmap1.height/2;var bitmap=new Bitmap(w,h*2);bitmap.blt(bitmap1,0,0,w,h,0,0);bitmap.blt(bitmap2,0,0,w,h,0,h);return bitmap};SpriteProcessor.processCompositeLowerCharacterBitmap=function(bitmap1,bitmap2){var w=bitmap1.width;var h=bitmap1.height/2;var bitmap=new Bitmap(w,h*2);bitmap.blt(bitmap1,0,h,w,h,0,0);bitmap.blt(bitmap2,0,h,w,h,0,h);return bitmap};
SpriteProcessor.saveToLocalFileSpex=function(filename,bitmap){var data=bitmap._canvas.toDataURL("image/png").replace(/^.*,/,"");var fs=require("fs");var dirPath=this._pathSpex;var filePath=dirPath+filename+".png";if(!fs.existsSync(dirPath))fs.mkdirSync(dirPath);fs.writeFileSync(filePath,new Buffer(data,"base64"))};
SpriteProcessor.saveToLocalFile8dir=function(filename,bitmap){var data=bitmap._canvas.toDataURL("image/png").replace(/^.*,/,"");var fs=require("fs");var dirPath=this._path8dir;var filePath=dirPath+filename+".png";if(!fs.existsSync(dirPath))fs.mkdirSync(dirPath);fs.writeFileSync(filePath,new Buffer(data,"base64"))};
SpriteProcessor.process8DirBitmap=function(filename,original){var w=original.width;var h=original.height;var bw=this.patternWidth(filename,original);var bh=this.patternHeight(filename,original);if(bw+bh!==Math.floor(bw+bh))alert("[Bitmap size error] "+this._files[this._processedIndex]+".png is not composed of 3x4 cells.");var result=new Bitmap(w,h);var bitmap=new Bitmap(bw,bh);var pad=Math.round(bw/48)*1;var cellsX=w/bw/3;var cellsY=h/bh/4;var charW=bw*3;var charH=bh*4;var sheet3x4=new Bitmap(charW,
charH);var startX;var startY;var cellX=0;for(;cellX<cellsX;cellX++){var cellY=0;for(;cellY<cellsY;cellY++){sheet3x4.clear();startX=cellX*charW;startY=cellY*charH;var i=0;for(;i<3;i++){bitmap.blt(original,bw*i+startX,startY,bw,bh,0,0);sheet3x4.blt(this.processLeftyBitmap(bitmap,-2),0,0,bw,bh,bw*i+pad,0);bitmap.clear()}var i$jscomp$0=0;for(;i$jscomp$0<3;i$jscomp$0++){bitmap.blt(original,bw*i$jscomp$0+startX,bh*3+startY,bw,bh,0,0);sheet3x4.blt(this.processLeftyBitmap(bitmap,-4),0,0,bw,bh,bw*i$jscomp$0+
pad,bh*3);bitmap.clear()}var i$jscomp$1=0;for(;i$jscomp$1<3;i$jscomp$1++){bitmap.blt(original,bw*i$jscomp$1+startX,startY,bw,bh,0,0);sheet3x4.blt(this.processRightyBitmap(bitmap,2),0,0,bw,bh,bw*i$jscomp$1-pad,bh*1);bitmap.clear()}var i$jscomp$2=0;for(;i$jscomp$2<3;i$jscomp$2++){bitmap.blt(original,bw*i$jscomp$2+startX,bh*3+startY,bw,bh,0,0);sheet3x4.blt(this.processRightyBitmap(bitmap,4),0,0,bw,bh,bw*i$jscomp$2-pad,bh*2);bitmap.clear()}result.blt(sheet3x4,0,0,charW,charH,charW*cellX,charH*cellY)}}return result};
SpriteProcessor.bodyRate=function(){return this._bodyRate||1};SpriteProcessor.bodyMargin=function(){return this._bodyMargin||0};
SpriteProcessor.processLeftyBitmap=function(bitmap,topPad){var bodyMargin=this.bodyMargin();var w=bitmap.width;var h=bitmap.height;var pad=Math.round(w/48);var layer1=new Bitmap(w,h);var sx1=Math.round(w*16/48);var dx1=Math.round(w*36/48);var sy1=Math.round(h*4/48);layer1.blt(bitmap,sx1,sy1,dx1-sx1,h,sx1,sy1);layer1.blt(bitmap,sx1,sy1,dx1-sx1,h-bodyMargin-sy1,sx1-pad,sy1);var sx2=Math.round(w*18/48);var dx2=Math.round(w*26/48);layer1.blt(bitmap,sx2,sy1,dx2-sx2,h-bodyMargin-sy1,sx2-1*pad,sy1);layer1.paintOpacity=
180;layer1.blt(bitmap,sx2,sy1,dx2-sx2,h-bodyMargin-sy1,sx2-2*pad,sy1);layer1.paintOpacity=255;var sy2=Math.round(h*29/48);layer1.blt(layer1,0,sy2,w,h-bodyMargin-sy2,pad,sy2);var sx3=Math.round(w*21/48);var dx3=Math.round(w*34/48);layer1.blt(layer1,sx3,0,dx3-sx3,h,sx3-pad,0);var sx5=Math.round(w*19/48);var dx5=w;layer1.blt(layer1,sx5,0,dx5-sx5,h,sx5-pad,0);var layer2=new Bitmap(w,h);var sx6=0;var dx6=Math.round(w*20/48);layer2.blt(bitmap,sx6,0,dx6-sx6,h,sx6,0);var sx7=Math.round(w*20/48);var dx7=w;
layer2.blt(bitmap,sx7,0,dx7-sx7,sy1,sx7+topPad,0);var sx8=Math.round(w*11/48);var dx8=w;layer2.blt(bitmap,sx8,sy1,dx8-sx8,h-bodyMargin-sy1,sx8-1*pad,sy1);layer2.paintOpacity=128;layer2.blt(bitmap,sx8,sy1,dx8-sx8,h-bodyMargin-sy1,sx8-2*pad,sy1);layer2.paintOpacity=255;var sx9=Math.round(w*20/48);var dx9=w;layer2.blt(bitmap,sx9,sy1,dx9-sx9,h-sy1,sx9-1*pad,sy1);layer2.paintOpacity=128;layer2.blt(bitmap,sx9,sy1,dx9-sx9,h-sy1,sx9-2*pad,sy1);layer2.blt(bitmap,sx9,sy1,dx9-sx9,h-sy1,sx9-3*pad,sy1);layer2.paintOpacity=
255;var sx10=Math.round(w*13/48);var dx10=w;layer2.blt(layer2,sx10,0,dx10-sx10,h,sx10-pad,0);layer2.blt(layer1,0,0,w,h,-1*pad,0);layer2.paintOpacity=128;layer2.blt(layer1,0,0,w,h,-2*pad,0);layer2.paintOpacity=255;return layer2};
SpriteProcessor.processRightyBitmap=function(bitmap,topPad){var bodyMargin=this.bodyMargin();var w=bitmap.width;var h=bitmap.height;var pad=-Math.round(w/48);var layer1=new Bitmap(w,h);var dx1=w-Math.round(w*16/48);var sx1=w-Math.round(w*36/48);var sy1=0;layer1.blt(bitmap,sx1,sy1,dx1-sx1,h,sx1,sy1);layer1.blt(bitmap,sx1,sy1,dx1-sx1,h-bodyMargin-sy1,sx1-pad,sy1);var dx2=w-Math.round(w*18/48);var sx2=w-Math.round(w*26/48);layer1.blt(bitmap,sx2,sy1,dx2-sx2,h-bodyMargin-sy1,sx2-1*pad,sy1);layer1.paintOpacity=
180;layer1.blt(bitmap,sx2,sy1,dx2-sx2,h-bodyMargin-sy1,sx2-2*pad,sy1);layer1.paintOpacity=255;var sy2=Math.round(h*29/48);layer1.blt(layer1,0,sy2,w,h-bodyMargin-sy2,pad,sy2);var dx3=w-Math.round(w*21/48);var sx3=w-Math.round(w*34/48);layer1.blt(layer1,sx3,0,dx3-sx3,h,sx3-pad,0);var dx5=w-Math.round(w*19/48);var sx5=0;layer1.blt(layer1,sx5,0,dx5-sx5,h,sx5-pad,0);var layer2=new Bitmap(w,h);var dx6=w;var sx6=w-Math.round(w*20/48);layer2.blt(bitmap,sx6,0,dx6-sx6,h,sx6,0);var dx7=w-Math.round(w*20/48);
var sx7=0;layer2.blt(bitmap,sx7,0,dx7-sx7,sy1,sx7+topPad,0);var dx8=w-Math.round(w*11/48);var sx8=0;layer2.blt(bitmap,sx8,sy1,dx8-sx8,h-bodyMargin-sy1,sx8-1*pad,sy1);layer2.paintOpacity=128;layer2.blt(bitmap,sx8,sy1,dx8-sx8,h-bodyMargin-sy1,sx8-2*pad,sy1);layer2.paintOpacity=255;var dx9=w-Math.round(w*20/48);var sx9=0;layer2.blt(bitmap,sx9,sy1,dx9-sx9,h-sy1,sx9-1*pad,sy1);layer2.paintOpacity=128;layer2.blt(bitmap,sx9,sy1,dx9-sx9,h-sy1,sx9-2*pad,sy1);layer2.blt(bitmap,sx9,sy1,dx9-sx9,h-sy1,sx9-3*pad,
sy1);layer2.paintOpacity=255;var dx10=w-Math.round(w*13/48);var sx10=0;layer2.blt(layer2,sx10,0,dx10-sx10,h,sx10-pad,0);layer2.blt(layer1,0,0,w,h,-1*pad,0);layer2.paintOpacity=128;layer2.blt(layer1,0,0,w,h,-2*pad,0);layer2.paintOpacity=255;return layer2};SpriteProcessor.patternWidth=function(filename,bitmap){if(ImageManager.isBigCharacter(filename))return bitmap.width/3;else return bitmap.width/12};
SpriteProcessor.patternHeight=function(filename,bitmap){if(ImageManager.isBigCharacter(filename))return bitmap.height/4;else return bitmap.height/8};TN._8DirectionGenerator=SpriteProcessor;
})();
