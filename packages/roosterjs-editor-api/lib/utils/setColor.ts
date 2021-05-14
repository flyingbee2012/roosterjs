import applyInlineStyle from '../utils/applyInlineStyle';
import { DarkModeDatasetNames, IEditor, ModeIndependentColor } from 'roosterjs-editor-types';

/**
 * @internal
 */
export default function setColor(
    editor: IEditor,
    color: string | ModeIndependentColor,
    isBackColor: boolean
) {
    const modeIndependentColor: ModeIndependentColor =
        typeof color === 'string' ? editor.getModeIndependentColor(color) : color;
    const darkMode = editor.isDarkMode();
    const appliedColor = darkMode
        ? modeIndependentColor.darkModeColor
        : modeIndependentColor.lightModeColor;
    applyInlineStyle(editor, (element, isInnerNode) => {
        element.style.setProperty(
            isBackColor ? 'background-color' : 'color',
            isInnerNode ? '' : appliedColor
        );
        if (darkMode) {
            element.dataset[
                isBackColor
                    ? DarkModeDatasetNames.OriginalStyleBackgroundColor
                    : DarkModeDatasetNames.OriginalStyleColor
            ] = modeIndependentColor.lightModeColor;
        }
    });
}
