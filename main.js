let image

function updateImageContainer() {
    if (image !== undefined) {
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');
        let img = new Image();
        img.src = image;
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;

            canvas.style.width = "100%";
            canvas.style.height = "auto";

            // Clear canvas and draw the image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    }     
}

function downloadCanvas() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'pixel-sorted-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function pixelSortHorizontal() {
    let threshold = parseInt(document.getElementById('threshold').value);
    const ctx = document.getElementById('canvas').getContext('2d');

    for(let row = 0; row < ctx.canvas.height; row++){
		const imgdata = ctx.getImageData(0, row, ctx.canvas.width, 1);
		const data = imgdata.data;

		const pixels = getPixelsArray(data);
		
		let start = 0;
		let end = findValueLess(pixels, threshold, start);

        while(start < ctx.canvas.height) {
			const range = pixels.splice(start, end - start);
			range.sort(getSortFunction());
			pixels.splice.apply(pixels, [start, 0].concat(range));
			
			start = end;
			end = findValueLess(pixels, threshold, start + 1);
		}

		setDataFromPixelsArray(data, pixels);
		ctx.putImageData(imgdata, 0, row);
	}
}

function pixelSortVertical() {
    let threshold = parseInt(document.getElementById('threshold').value);
    const ctx = document.getElementById('canvas').getContext('2d');

    for (let col = 0; col < ctx.canvas.width; col++) {
        const imgdata = ctx.getImageData(col, 0, 1, ctx.canvas.height);
        const data = imgdata.data;

        const pixels = getPixelsArray(data);

        let start = 0;
        let end = findValueLess(pixels, threshold, start);

        while(start < ctx.canvas.height) {
			const range = pixels.splice(start, end - start);
			range.sort(getSortFunction());
			pixels.splice.apply(pixels, [start, 0].concat(range));
			
			start = end;
			end = findValueLess(pixels, threshold, start + 1);
		}

		setDataFromPixelsArray(data, pixels);
		ctx.putImageData(imgdata, col, 0);
    }
}

function getSortFunction() {
    const sort = document.getElementById('sort-type').value;
    switch(sort) {
        case 'hue': return hueSort;
        case 'lightness': return lightnessSort;
        case 'saturation': return saturationSort;
        case 'red': return redSort;
        case 'green': return greenSort;
        case 'blue': return blueSort;
        case 'brightness': return simpleMeanSort;
        default: return simpleMeanSort;
    }
}

function simpleMeanSort(a,b){
	const aa = (a.r + a.g + a.b) / 3;
	const bb = (b.r + b.g + b.b) / 3;
	return aa < bb ? -1: (aa > bb ? 1 : 0);
}

function hueSort(a, b) {
    const aa = rgbToHsl(a.r, a.g, a.b)[0];
    const bb = rgbToHsl(b.r, b.g, b.b)[0];
    return aa - bb;
}

function lightnessSort(a, b) {
    const aa = rgbToHsl(a.r, a.g, a.b)[2];
    const bb = rgbToHsl(b.r, b.g, b.b)[2];
    return aa - bb;
}

function saturationSort(a, b) {
    const aa = rgbToHsl(a.r, a.g, a.b)[1];
    const bb = rgbToHsl(b.r, b.g, b.b)[1];
    return aa - bb;
}

function redSort(a, b) {
    return a.r - b.r;
}

function greenSort(a, b) {
    return a.g - b.g;
}

function blueSort(a, b) {
    return a.b - b.b;
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

function getPixelsArray(data){
	const pixels = [];
    let c = 0;
	for (let i = 0; i < data.length / 4; i++) {
		c = i * 4;
		pixels.push({r: data[c + 0], g: data[c + 1], b: data[c + 2]});
	};
	return pixels;
}

function setDataFromPixelsArray(data, pixels){
	let c = 0;
	for (var i = 0; i < pixels.length; i++) {
		c= i * 4;
		data[c + 0]= pixels[i].r;
		data[c + 1]= pixels[i].g;
		data[c + 2]= pixels[i].b;
	}
}

function findValueLess(pixels, val, start){
	for (var i = start; i < pixels.length; i++){
		if ((pixels[i].r + pixels[i].g + pixels[i].b) / 3 < val) {
			return i;
		}
	}
	return pixels.length;
}

function resizeCanvasToDisplaySize() {
    const canvas = document.querySelector("#canvas")[0];
    const container = document.querySelector("#canvas-container");

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        updateImageContainer();
    }
    return false;
}



$(document).ready(function() {
    $('#upload').on('click', function(e) {
        $('#file-input').click();

        // get the uploaded file
        $('#file-input').on('change', function(e) {
            let file = e.target.files[0];
            let reader = new FileReader();

            reader.onload = function(e) {
                image = e.target.result;
                updateImageContainer();
            };

            reader.readAsDataURL(file);
        });
    });

    $('#sort').on('click', function(e) {
        const direction = document.getElementById('direction').value
        switch(direction) {
            case 'horizontal': {
                pixelSortHorizontal();
                break;
            }
            case 'vertical': {
                pixelSortVertical();
                break;
            }
            default: break;
        }
    });

    $('#threshold').on('input', function(e) {
        $('#threshold-label').text('Threshold ' + e.target.value);
    });

    $('#reset').on('click', function(e) {
        updateImageContainer();
    });

    $('#download').on('click', function(e) {
        downloadCanvas();
    });
 
    resizeCanvasToDisplaySize();
    $(window).on('resize', resizeCanvasToDisplaySize);
});

