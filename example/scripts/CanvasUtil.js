var BlendMode = function(){
    return {
        Normal : "source-over",
        Additive : "lighter",
        XOR : "xor"
    };
}();
var CanvasUtil = function(){
	function _assertRenderArgs(renderArgs){
		Util.assertObject(renderArgs);
        Util.assertNumber(renderArgs.x);
        Util.assertNumber(renderArgs.y);
        Util.assertNumber(renderArgs.width);
        Util.assertNumber(renderArgs.height);
		return true;
	}
    function _fillContext(context, clearColor){
        /*strip*/
        Util.assertContext(context);
        Util.assertString(clearColor);
        /*strip*/

		//clear
		context.fillStyle = clearColor;
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    }
    function _drawTextOnContext(renderArgs, context) {
        /*strip*/
        _assertRenderArgs(renderArgs);
        Util.assertContext(context);
        Util.assertString(renderArgs.text);
        /*strip*/

        context.save();
        context.translate(renderArgs.x, renderArgs.y);
        context.font = Consts.Font;
        context.strokeStyle = "#FFF";
        context.fillStyle = "#FFF";
        context.fillText(renderArgs.text, -renderArgs.width * 0.5, renderArgs.height * 0.5);
        context.restore();
    }
    function _drawElementOnContext(renderArgs, sourceElement, destContext) {
        /*strip*/
        _assertRenderArgs(renderArgs);
        Util.assertContext(destContext);
        Util.assertObject(sourceElement);
        /*strip*/

        //TODO: im sure this can be done way faster
        destContext.globalAlpha = renderArgs.alpha || 1.0;
        destContext.globalCompositeOperation = renderArgs.blendmode || BlendMode.Normal;

        destContext.save();
        destContext.translate(renderArgs.x, renderArgs.y);
        destContext.rotate(renderArgs.rotation || 0);
        destContext.scale(renderArgs.scale, renderArgs.scale);
        destContext.translate(renderArgs.width * -0.5, renderArgs.height * -0.5);
        destContext.drawImage(sourceElement, 0, 0, renderArgs.width, renderArgs.height);
        destContext.restore();

        destContext.globalCompositeOperation = BlendMode.Normal;
        destContext.globalAlpha = 1.0;
    }
    function _drawCircle(context, x, y, color, radius){
        /*strip*/
        Util.assertNumber(x);
        Util.assertNumber(y);
        Util.assertString(color);
        Util.assertNumber(radius);
        /*strip*/

        context.save();
        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI, false);
        context.fillStyle = color;
        context.fill();
        context.restore();
    }
    function _rgb(r, g, b){
        /*strip*/
        Util.assertNumber(r);
        Util.assertNumber(g);
        Util.assertNumber(b);
        Util.assertNumber(b);
        if (r < 0 || r > 1 ||
            g < 0 || g > 1 ||
            b < 0 || b > 1){
            _error("Util: rgb: bad RGB values = " + r + " - " + g + " - " + b);
            return "rgb(255, 0, 255)";
        }
        /*strip*/

        //scale and round
        r = Math.round(r * 255);
        g = Math.round(g * 255);
        b = Math.round(b * 255);

        var ret = "rgb(";
        ret +=r.toString() + ", " + g.toString() + ", " + b.toString();
        ret += ")";
        return ret;
    }
    function _rgba(r, g, b, a){
        /*strip*/
        Util.assertNumber(r);
        Util.assertNumber(g);
        Util.assertNumber(b);
        Util.assertNumber(a);
        if (r < 0 || r > 1 ||
            g < 0 || g > 1 ||
            b < 0 || b > 1 ||
            a < 0 || a > 1){
            _error("Util: rgba: bad RGBA values = " + r + " - " + g + " - " + b + " - " + a);
            return "rgba(255, 0, 255, 255)";
        }
        /*strip*/

        //scale and round
        r = Math.round(r * 255);
        g = Math.round(g * 255);
        b = Math.round(b * 255);
        a = Math.round(a * 255);
        var ret = "rgba(";
        ret += r.toString() + ", " + g.toString() + ", " + b.toString() + ", " + a.toString();
        ret += ")";
        return ret;
    }
    return {
        rgb: _rgb,
        rgba: _rgba,
        drawTextOnContext: _drawTextOnContext,
        fillContext: _fillContext,
        drawElementOnContext: _drawElementOnContext,
        drawCircle: _drawCircle
    };
}();
