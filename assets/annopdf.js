$(function(){
    var canvascontainer = document.getElementById('canvascontainer');
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    //ctx.fillStyle = "solid";
  	//ctx.strokeStyle = "#ff0000";
    //ctx.lineWidth = 3;
    //ctx.lineCap = "round";
  	canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvascontainer.appendChild(canvas);
  	var img = new Image();
    var writeable=false;
    var writing=false;
    var lines=[];


    var mouse;
    img.onload = function(){

      trackTransforms(ctx);

      function redraw(){
  			// Clear the entire canvas
  			var p1 = ctx.transformedPoint(0,0);
  			var p2 = ctx.transformedPoint(canvas.width,canvas.height);
  			ctx.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);
  			ctx.drawImage(img,0,0);
        for(var i=0;i<lines.length;i++){
          ctx.beginPath();
          ctx.strokeStyle = "#ff0000";
          ctx.moveTo(lines[i][0],lines[i][1]);
          ctx.lineTo(lines[i][2],lines[i][3]);
          ctx.stroke();
        }
  		}
      redraw();
      var lastX=canvas.width/2, lastY=canvas.height/2;
  		var dragStart,dragged;
  		canvas.addEventListener('mousedown',function(evt){
    			document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
    			lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
    			lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
    			dragStart = ctx.transformedPoint(lastX,lastY);
          if(writeable){writing=true;}
    			else{dragged = false;}
  		},false);
  		canvas.addEventListener('mousemove',function(evt){
  			lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
  			lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        dragged = true;
  			if (dragStart){
  				var pt = ctx.transformedPoint(lastX,lastY);
          if(writing){
            lines.push([dragStart.x,dragStart.y,pt.x,pt.y]);
            socket.emit('updatelines',lines);
            dragStart=pt;
          }
  				else{ctx.translate(pt.x-dragStart.x,pt.y-dragStart.y);}
  				redraw();
  			}
  		},false);
  		canvas.addEventListener('mouseup',function(evt){
  			dragStart = null;
        writing=false;
  		},false);
      canvas.addEventListener('mouseout',function(evt){
  			dragStart = null;
        writing=false;
  		},false);

  		var scaleFactor = 1.1;
  		var zoom = function(clicks){
  			var pt = ctx.transformedPoint(lastX,lastY);
  			ctx.translate(pt.x,pt.y);
  			var factor = Math.pow(scaleFactor,clicks);
  			ctx.scale(factor,factor);
  			ctx.translate(-pt.x,-pt.y);
  			redraw();
  		};

  		var handleScroll = function(evt){
  			var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
  			if (delta) zoom(delta);
  			return evt.preventDefault() && false;
  		};
  		canvas.addEventListener('DOMMouseScroll',handleScroll,false);
  		canvas.addEventListener('mousewheel',handleScroll,false);

      window.addEventListener('keydown',function(evt){
        switch(evt.key){
          case "z":
            writeable=true;
            break;
          case "x":
            lines=[];
            redraw();
            socket.emit('updatelines',lines);
            break;
          case "c":
            var msg=ctx.getTransform();
            socket.emit('updatetransform',{a:msg.a,b:msg.b,c:msg.c,d:msg.d,e:msg.e,f:msg.f});
            break;
          default:
        }
      });
      window.addEventListener('keyup',function(evt){
        if(evt.key=="z"){writeable=false;}
      });
      socket.on('updatelines',function(msg){
        lines=msg;
        redraw();
      });
      socket.emit('readyforline');
      socket.on('updatetransform',function(msg){
        ctx.setTransform(msg.a,msg.b,msg.c,msg.d,msg.e,msg.f);
        redraw();
      });
  	};




  	img.src ="/static/Montage.png";


  	// Adds ctx.getTransform() - returns an SVGMatrix
  	// Adds ctx.transformedPoint(x,y) - returns an SVGPoint
  	function trackTransforms(ctx){
  		var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
  		var xform = svg.createSVGMatrix();
  		ctx.getTransform = function(){ return xform; };

  		var savedTransforms = [];
  		var save = ctx.save;
  		ctx.save = function(){
  			savedTransforms.push(xform.translate(0,0));
  			return save.call(ctx);
  		};
  		var restore = ctx.restore;
  		ctx.restore = function(){
  			xform = savedTransforms.pop();
  			return restore.call(ctx);
  		};

  		var scale = ctx.scale;
  		ctx.scale = function(sx,sy){
  			xform = xform.scaleNonUniform(sx,sy);
  			return scale.call(ctx,sx,sy);
  		};
  		var rotate = ctx.rotate;
  		ctx.rotate = function(radians){
  			xform = xform.rotate(radians*180/Math.PI);
  			return rotate.call(ctx,radians);
  		};
  		var translate = ctx.translate;
  		ctx.translate = function(dx,dy){
  			xform = xform.translate(dx,dy);
  			return translate.call(ctx,dx,dy);
  		};
  		var transform = ctx.transform;
  		ctx.transform = function(a,b,c,d,e,f){
  			var m2 = svg.createSVGMatrix();
  			m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
  			xform = xform.multiply(m2);
  			return transform.call(ctx,a,b,c,d,e,f);
  		};
  		var setTransform = ctx.setTransform;
  		ctx.setTransform = function(a,b,c,d,e,f){
  			xform.a = a;
  			xform.b = b;
  			xform.c = c;
  			xform.d = d;
  			xform.e = e;
  			xform.f = f;
  			return setTransform.call(ctx,a,b,c,d,e,f);
  		};
  		var pt  = svg.createSVGPoint();
  		ctx.transformedPoint = function(x,y){
  			pt.x=x; pt.y=y;
  			return pt.matrixTransform(xform.inverse());
  		};
  	}
});
