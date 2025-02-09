import checkEditInfoState, { ImageEditInfoState } from './checkEditInfoState';
import ImageEditInfo from '../types/ImageEditInfo';

const IMAGE_EDIT_INFO_NAME = 'roosterEditInfo';

/**
 * @internal
 * Save edit info to image
 * @param image The image to save edit info to
 * @param editInfo The edit info to save
 */
export function saveEditInfo(image: HTMLImageElement, editInfo: ImageEditInfo) {
    if (image) {
        image.dataset[IMAGE_EDIT_INFO_NAME] = JSON.stringify(editInfo);
    }
}

/**
 * @internal
 * Delete edit info of an image if any
 * @param image The image to delete edit info from
 */
export function deleteEditInfo(image: HTMLImageElement) {
    if (image) {
        delete image.dataset[IMAGE_EDIT_INFO_NAME];
    }
}

/**
 * @internal
 * Get image edit info from an image. If the image doesn't have edit info, create one from this image.
 * When create new edit info, it will have width/height set to the image's current client width/height, and
 * natural width/height set to the image's natural width/height, src set to its current src, and all
 * other fields set to 0.
 * @param image The image to get edit info from
 */
export function getEditInfoFromImage(image: HTMLImageElement): ImageEditInfo {
    const obj = safeParseJSON(image?.dataset[IMAGE_EDIT_INFO_NAME]) as ImageEditInfo;
    return checkEditInfoState(obj) == ImageEditInfoState.Invalid ? getInitialEditInfo(image) : obj;
}

function getInitialEditInfo(image: HTMLImageElement): ImageEditInfo {
    return {
        src: image.getAttribute('src') || '',
        widthPx: image.clientWidth,
        heightPx: image.clientHeight,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        leftPercent: 0,
        rightPercent: 0,
        topPercent: 0,
        bottomPercent: 0,
        angleRad: 0,
    };
}

function safeParseJSON(json: string): any {
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}
