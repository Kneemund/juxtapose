const urlSearchParams = new URLSearchParams(window.location.search);
const parameters = {
    data: urlSearchParams.get('d'),
    mac: urlSearchParams.get('m'),
    orientation: urlSearchParams.get('o'),
};

function displayErrorMessage(error) {
    const errorMessage = document.querySelector('.error-message');
    if (errorMessage.hidden === false) return;

    const imageComparison = document.querySelector('.image-comparison');
    imageComparison.remove();

    errorMessage.textContent = error;
    errorMessage.hidden = false;

    throw new Error(error);
}

if (!parameters.data || !parameters.mac || !parameters.orientation) {
    displayErrorMessage('The URL is malformed.');
}

fetch(`https://api.kneemund.de/juxtapose/url?d=${parameters.data}&m=${parameters.mac}`)
    .then((data) => {
        switch (data.status) {
            case 400:
                displayErrorMessage('The URL is invalid.');
                break;
            case 404:
                displayErrorMessage('The juxtapose message was deleted and the images expired.');
                break;
            case 500:
                displayErrorMessage('The API request could not be processed.');
                break;
        }

        return data.json();
    })
    .then((data) => {
        // beforeImage.src = data.left_image_url;
        // afterImage.src = data.right_image_url;
        // if (data.left_image_label) {
        //     beforeLabelText.textContent = data.left_image_label;
        //     beforeLabel.style.display = 'flex';
        // }
        // if (data.right_image_label) {
        //     afterLabelText.textContent = data.right_image_label;
        //     afterLabel.style.display = 'flex';
        // }
    })
    .catch(() => {
        // displayErrorMessage('The API request failed.');
    });

function initializeFullscreenCanvas(canvas) {
    // Get the DPR and size of the canvas
    const dpr = window.devicePixelRatio;

    // Set the "actual" size of the canvas
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    // Scale the context to ensure correct drawing operations
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Set the "drawn" size of the canvas
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    ctx.fillStyle = 'white';
    return ctx;
}

let mousedownIntervalID = -1;

const canvas = document.getElementById('canvas');
let ctx;

const leftImage = new Image();
const rightImage = new Image();
let previewImageWidth = 0;
let previewImageHeight = 0;

let leftImageWithLabel, rightImageWithLabel;

function draw(offset) {
    if (parameters.orientation === 'h') {
        // horizontal
        ctx.drawImage(leftImageWithLabel, 0, 0, previewImageWidth, offset, 0, 0, previewImageWidth, offset);

        ctx.drawImage(
            rightImageWithLabel,
            0,
            offset,
            previewImageWidth,
            previewImageHeight - offset,
            0,
            offset,
            previewImageWidth,
            previewImageHeight - offset
        );

        ctx.fillRect(0, offset - 1, previewImageWidth, 2);
    } else {
        // vertical
        ctx.drawImage(leftImageWithLabel, 0, 0, offset, previewImageHeight, 0, 0, offset, previewImageHeight);

        ctx.drawImage(
            rightImageWithLabel,
            offset,
            0,
            previewImageWidth - offset,
            previewImageHeight,
            offset,
            0,
            previewImageWidth - offset,
            previewImageHeight
        );

        ctx.fillRect(offset - 1, 0, 2, previewImageHeight);
    }
}

function updateCanvas(e) {
    e.stopPropagation();
    draw(parameters.orientation === 'h' ? e.offsetY : e.offsetX);
}

function drawText(ctx, alignment, text) {
    const MARGIN = 14;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.textAlign = 'left';
    ctx.font = 'bold 28px sans-serif';
    ctx.textBaseline = 'top';

    const textSize = ctx.measureText(text);
    console.log(textSize.ideographicBaseline, textSize);
    const textHeight = textSize.actualBoundingBoxAscent - textSize.ideographicBaseline;

    let x, y;
    if (alignment === 'top_left') {
        x = 0;
        y = 0;
    } else if (alignment === 'bottom_left') {
        x = 0;
        y = previewImageHeight - textHeight - 2 * MARGIN;
    } else if (alignment === 'bottom_right') {
        x = previewImageWidth - textSize.width - 2 * MARGIN;
        y = previewImageHeight - textHeight - 2 * MARGIN;
    } else {
        throw new Error('Invalid alignment');
    }

    ctx.fillRect(x, y, textSize.width + MARGIN * 2, textHeight + MARGIN * 2);

    ctx.fillStyle = 'white';
    ctx.fillText(text, x + MARGIN, y + MARGIN);
}

async function drawInitialCanvas() {
    leftImage.src =
        'https://cdn.discordapp.com/attachments/1165454160976679033/1166717629763948704/Bildschirmfoto_vom_2022-11-17_20-11-31.png';

    rightImage.src =
        'https://cdn.discordapp.com/attachments/1165454160976679033/1166717630250496071/Bildschirmfoto_vom_2022-11-17_20-15-40.png';

    await Promise.all([leftImage.decode(), rightImage.decode()]);

    previewImageWidth = Math.min(leftImage.width, rightImage.width);
    previewImageHeight = Math.min(leftImage.height, rightImage.height);

    if (previewImageWidth > window.innerWidth) {
        previewImageWidth = window.innerWidth;
        previewImageHeight = (rightImage.height * previewImageWidth) / rightImage.width;
    }

    if (previewImageHeight > window.innerHeight) {
        previewImageHeight = window.innerHeight;
        previewImageWidth = (rightImage.width * previewImageHeight) / rightImage.height;
    }

    previewImageHeight = Math.floor(previewImageHeight);
    previewImageWidth = Math.floor(previewImageWidth);

    canvas.width = previewImageWidth;
    canvas.height = previewImageHeight;

    ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';

    const leftImageCanvas = new OffscreenCanvas(previewImageWidth, previewImageHeight);
    const rightImageCanvas = new OffscreenCanvas(previewImageWidth, previewImageHeight);

    const leftImageCanvasCtx = leftImageCanvas.getContext('2d');
    const rightImageCanvasCtx = rightImageCanvas.getContext('2d');

    leftImageCanvasCtx.drawImage(leftImage, 0, 0, previewImageWidth, previewImageHeight);
    rightImageCanvasCtx.drawImage(rightImage, 0, 0, previewImageWidth, previewImageHeight);

    drawText(leftImageCanvasCtx, parameters.orientation === 'h' ? 'top_left' : 'bottom_left', 'Left');
    drawText(rightImageCanvasCtx, parameters.orientation === 'h' ? 'bottom_left' : 'bottom_right', 'Right');

    leftImageWithLabel = leftImageCanvas.transferToImageBitmap();
    rightImageWithLabel = rightImageCanvas.transferToImageBitmap();

    draw(parameters.orientation === 'h' ? previewImageHeight / 2 : previewImageWidth / 2);

    canvas.addEventListener('mousedown', (e) => {
        updateCanvas(e);
        canvas.addEventListener('mousemove', updateCanvas);
    });

    canvas.addEventListener('mouseup', () => {
        canvas.removeEventListener('mousemove', updateCanvas);
    });
}

drawInitialCanvas();
// window.onresize = drawInitialCanvas;
