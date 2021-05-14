import { DarkModeDatasetNames, ModeIndependentColor } from 'roosterjs-editor-types';

export default function setColor(
    element: HTMLElement,
    color: string | ModeIndependentColor,
    isBackgroundColor: boolean,
    isDarkMode?: boolean
) {
    const colorString = typeof color === 'string' ? color.trim() : '';
    const modeIndependentColor = typeof color === 'string' ? null : color;

    if (colorString || modeIndependentColor) {
        element.style.setProperty(
            isBackgroundColor ? 'background-color' : 'color',
            (isDarkMode
                ? modeIndependentColor?.darkModeColor
                : modeIndependentColor?.lightModeColor) || colorString
        );

        if (modeIndependentColor && isDarkMode && element.dataset) {
            element.dataset[
                isBackgroundColor
                    ? DarkModeDatasetNames.OriginalStyleBackgroundColor
                    : DarkModeDatasetNames.OriginalStyleColor
            ] = modeIndependentColor.lightModeColor;
        }
    }
}
