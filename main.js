let image

function updateImageContainer() {
    if (image !== undefined) {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
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

function applyRangeMask() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const lowThreshold = parseInt(document.getElementById('low-threshold').value);
    const highThreshold = parseInt(document.getElementById('high-threshold').value);

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Compute the grayscale intensity
        const intensity = (r + g + b) / 3;

        // Apply range mask
        if (intensity >= lowThreshold && intensity <= highThreshold) {
            data[i] = 255;   // White for mask
            data[i + 1] = 255;
            data[i + 2] = 255;
        } else {
            data[i] = 0;     // Black for mask
            data[i + 1] = 0;
            data[i + 2] = 0;
        }
    }

    ctx.putImageData(imgData, 0, 0);
    return imgData; // Return the mask for further use
}


function pixelSortWithRangeMaskHorizontal() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const maskData = applyRangeMask(); // Get the range mask

    for (let row = 0; row < height; row++) {
        const rowStart = row * width * 4;
        const rowEnd = rowStart + width * 4;

        // Extract the row of pixels
        const pixels = [];
        const mask = [];

        for (let i = rowStart; i < rowEnd; i += 4) {
            const r = maskData.data[i];
            mask.push(r === 255); // True if the mask allows sorting
            pixels.push({
                r: data[i],
                g: data[i + 1],
                b: data[i + 2],
                a: data[i + 3],
            });
        }

        // Sort only the pixels within the mask
        let start = 0;
        while (start < mask.length) {
            if (mask[start]) {
                let end = start;
                while (end < mask.length && mask[end]) {
                    end++;
                }

                // Sort the pixels in this range
                const range = pixels.slice(start, end);
                range.sort(getSortFunction());

                // Replace the sorted pixels back into the array
                for (let i = start; i < end; i++) {
                    pixels[i] = range[i - start];
                }

                start = end;
            } else {
                start++;
            }
        }

        // Write the sorted row back into the image data
        for (let i = rowStart, j = 0; i < rowEnd; i += 4, j++) {
            data[i] = pixels[j].r;
            data[i + 1] = pixels[j].g;
            data[i + 2] = pixels[j].b;
            data[i + 3] = pixels[j].a;
        }
    }

    ctx.putImageData(imgData, 0, 0);
}

function pixelSortWithRangeMaskVertical() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const maskData = applyRangeMask(); // Get the range mask

    for (let col = 0; col < width; col++) {
        const pixels = [];
        const mask = [];

        // Extract the column of pixels
        for (let row = 0; row < height; row++) {
            const index = (row * width + col) * 4;
            const r = maskData.data[index];
            mask.push(r === 255); // True if the mask allows sorting
            pixels.push({
                r: data[index],
                g: data[index + 1],
                b: data[index + 2],
                a: data[index + 3],
            });
        }

        let start = 0;
        while (start < mask.length) {
            if (mask[start]) {
                let end = start;
                while (end < mask.length && mask[end]) {
                    end++;
                }

                // Sort the pixels in this range
                const range = pixels.slice(start, end);
                range.sort(getSortFunction());

                // Replace the sorted pixels back into the array
                for (let i = start; i < end; i++) {
                    pixels[i] = range[i - start];
                }

                start = end;
            } else {
                start++;
            }
        }

        // Write the sorted column back into the image data
        for (let row = 0; row < height; row++) {
            const index = (row * width + col) * 4;
            data[index] = pixels[row].r;
            data[index + 1] = pixels[row].g;
            data[index + 2] = pixels[row].b;
            data[index + 3] = pixels[row].a;
        }
    }

    ctx.putImageData(imgData, 0, 0);
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
                pixelSortWithRangeMaskHorizontal();
                break;
            }
            case 'vertical': {
                pixelSortWithRangeMaskVertical();
                break;
            }
            default: break;
        }
    });

    $('#mask-preview').on('click', function(e) {
        applyRangeMask();
    });

    $('#threshold').on('input', function(e) {
        $('#threshold-label').text('Threshold ' + e.target.value);
    });

    $('#low-threshold').on('input', function(e) {
        $('#low-threshold-label').text('Mask low threshold ' + e.target.value);
    });

    $('#high-threshold').on('input', function(e) {
        $('#high-threshold-label').text('Mask high threshold ' + e.target.value);
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

