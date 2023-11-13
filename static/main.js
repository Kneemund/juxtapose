const beforeImage = document.querySelector('.image-comparison .before-image');
const afterImage = document.querySelector('.image-comparison .after-image');

const beforeLabel = document.querySelector('.image-comparison .before-label');
const afterLabel = document.querySelector('.image-comparison .after-label');

const beforeLabelText = beforeLabel.firstElementChild;
const afterLabelText = afterLabel.firstElementChild;

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
        beforeImage.src = data.left_image_url;
        afterImage.src = data.right_image_url;

        if (data.left_image_label) {
            beforeLabelText.textContent = data.left_image_label;
            beforeLabel.style.display = 'flex';
        }

        if (data.right_image_label) {
            afterLabelText.textContent = data.right_image_label;
            afterLabel.style.display = 'flex';
        }
    })
    .catch(() => {
        displayErrorMessage('The API request failed.');
    });

const imagesContainer = document.querySelector('.images-container');
const slider = document.querySelector('.image-comparison .slider');
const sliderLine = document.querySelector('.image-comparison .slider-line');
const sliderIcon = document.querySelector('.image-comparison .slider-icon');

window.addEventListener('load', () => {
    if (parameters.orientation === "v") {
        slider.setAttribute('orient', 'vertical');
        slider.style.appearance = 'slider-vertical';
        slider.style.cursor = 'row-resize';
    
        beforeImage.style.height = '50%';
        beforeImage.style.top = '0';
        beforeImage.style['object-position'] = 'top';
    
        sliderLine.style.width = '100%';
        sliderLine.style.height = '4px';
        sliderLine.style.transform = 'translateY(-50%)';
        sliderLine.style.top = '50%';

        sliderIcon.style.transform = 'translate(-50%, -50%) rotate(90deg)';
        sliderIcon.style.top = '50%';

        beforeLabel.style['max-height'] = '50%';
        beforeLabel.style.top = '0';
        beforeLabel.style.left = '0';

        afterLabel.style['max-height'] = '50%';
        afterLabel.style.bottom = '0';
        afterLabel.style.left = '0';
        afterLabel.style['flex-direction'] = 'column';
    } else {
        slider.style.cursor = 'col-resize';

        beforeImage.style.width = '50%';
        beforeImage.style.top = '0';
        beforeImage.style['object-position'] = 'left';

        sliderLine.style.height = '100%';
        sliderLine.style.width = '4px';
        sliderLine.style.transform = 'translateX(-50%)';
        sliderLine.style.left = '50%';

        sliderIcon.style.transform = 'translate(-50%, -50%)';
        sliderIcon.style.left = '50%';

        beforeLabel.style['max-width'] = '50%';
        beforeLabel.style.bottom = '0';
        beforeLabel.style.left = '0';

        afterLabel.style['max-width'] = '50%';
        afterLabel.style.bottom = '0';
        afterLabel.style.right = '0';
        afterLabel.style['flex-direction'] = 'row';
    }

    resizeImagesContainer();
});

slider.addEventListener('input', (e) => {
    const sliderValue = e.target.value + '%';
    const inverseSliderValue = 100 - e.target.value + '%';

    if (parameters.orientation === "v") {
        beforeLabel.style['max-height'] = inverseSliderValue;
        afterLabel.style['max-height'] = sliderValue;

        beforeImage.style.height = inverseSliderValue;
        sliderLine.style.top = inverseSliderValue;
        sliderIcon.style.top = inverseSliderValue;
    } else {
        beforeLabel.style['max-width'] = sliderValue;
        afterLabel.style['max-width'] = inverseSliderValue;
    
        beforeImage.style.width = sliderValue;
        sliderLine.style.left = sliderValue;
        sliderIcon.style.left = sliderValue;
    }
});

slider.addEventListener('mouseup', (e) => {
    e.target.blur();
});

function resizeImagesContainer() {
    let width = Math.min(afterImage.naturalWidth, beforeImage.naturalWidth);
    let height = Math.min(afterImage.naturalHeight, beforeImage.naturalHeight);
    
    if (width > window.innerWidth * window.devicePixelRatio) {
        width = window.innerWidth * window.devicePixelRatio;
        height = (afterImage.naturalHeight * width) / afterImage.naturalWidth;
    }
    
    if (height > window.innerHeight * window.devicePixelRatio) {
        height = window.innerHeight * window.devicePixelRatio;
        width = (afterImage.naturalWidth * height) / afterImage.naturalHeight;
    }
    
    imagesContainer.style.width = width + 'px';
    imagesContainer.style.height = height + 'px';
}

window.addEventListener('resize', resizeImagesContainer);