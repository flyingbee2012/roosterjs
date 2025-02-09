import { getTagOfNode, toArray, VTable } from 'roosterjs-editor-dom';
import {
    EditorCore,
    SelectionRangeTypes,
    TableSelection,
    SelectTable,
    Coordinates,
} from 'roosterjs-editor-types';

const TABLE_ID = 'tableSelected';
const CONTENT_DIV_ID = 'contentDiv_';
const STYLE_ID = 'tableStyle';

/**
 * @internal
 * Select a table and save data of the selected range
 * @param core The EditorCore object
 * @param table table to select
 * @param coordinates first and last cell of the selection, if this parameter is null, instead of
 * selecting, will unselect the table.
 * @returns true if successful
 */
export const selectTable: SelectTable = (
    core: EditorCore,
    table: HTMLTableElement,
    coordinates?: TableSelection
) => {
    unselect(core.contentDiv.ownerDocument);

    if (coordinates && table) {
        ensureUniqueId(table, TABLE_ID);
        ensureUniqueId(core.contentDiv, CONTENT_DIV_ID);

        const ranges = select(core, table, coordinates);
        return {
            type: SelectionRangeTypes.TableSelection,
            ranges,
            table,
            areAllCollapsed: ranges.filter(range => range?.collapsed).length == ranges.length,
            coordinates,
        };
    }

    return null;
};

function buildCss(
    table: HTMLTableElement,
    coordinates: TableSelection,
    contentDivSelector: string
): { css: string; ranges: Range[] } {
    coordinates = normalizeTableSelection(coordinates, table);
    const tr1 = coordinates.firstCell.y;
    const td1 = coordinates.firstCell.x;
    const tr2 = coordinates.lastCell.y;
    const td2 = coordinates.lastCell.x;
    const ranges: Range[] = [];

    let firstSelected: HTMLTableCellElement | null = null;
    let lastSelected: HTMLTableCellElement | null = null;
    let css = '';
    let isFirst = true;

    const vTable = new VTable(table);

    // Get whether table has thead, tbody or tfoot.
    const tableChildren = toArray(table.childNodes).filter(
        node => ['THEAD', 'TBODY', 'TFOOT'].indexOf(getTagOfNode(node)) > -1
    );
    // Set the start and end of each of the table childs, so we can build the selector according the element between the table and the row.
    let cont = 0;
    const indexes = tableChildren.map(node => {
        const result = {
            el: getTagOfNode(node),
            start: cont,
            end: node.childNodes.length + cont,
        };

        cont = result.end;
        return result;
    });

    vTable.cells.forEach((row, rowIndex) => {
        let tdCount = 0;
        let thCount = 0;
        firstSelected = null;
        lastSelected = null;

        //Get current TBODY/THEAD/TFOOT
        const midElement = indexes.filter(ind => ind.start <= rowIndex && ind.end > rowIndex)[0];

        const middleElSelector = midElement ? '>' + midElement.el + '>' : '>';
        const currentRow =
            midElement && rowIndex + 1 >= midElement.start
                ? rowIndex + 1 - midElement.start
                : rowIndex + 1;

        for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
            if (row[cellIndex].td) {
                const tag = getTagOfNode(row[cellIndex].td);

                if (tag == 'TD') {
                    tdCount++;
                }
                if (tag == 'TH') {
                    thCount++;
                }

                if (rowIndex >= tr1 && rowIndex <= tr2 && cellIndex >= td1 && cellIndex <= td2) {
                    if (isFirst) {
                        isFirst = false;
                    } else if (!css.endsWith(',')) {
                        css += ',';
                    }
                    const selector = generateCssFromCell(
                        contentDivSelector,
                        table.id,
                        middleElSelector,
                        currentRow,
                        tag,
                        tag == 'TD' ? tdCount : thCount
                    );
                    css += selector;
                    firstSelected = firstSelected || table.querySelector(selector);
                    lastSelected = table.querySelector(selector)!;
                }
            }

            if (firstSelected && lastSelected) {
                const rowRange = new Range();
                rowRange.setStartBefore(firstSelected);
                rowRange.setEndAfter(lastSelected);
                ranges.push(rowRange);
            }
        }
    });

    css += '{background-color: rgba(198,198,198,0.7) !important;}';

    return { css, ranges };
}

function select(core: EditorCore, table: HTMLTableElement, coordinates: TableSelection): Range[] {
    const doc = core.contentDiv.ownerDocument;
    const contentDivSelector = '#' + core.contentDiv.id;
    let { css, ranges } = buildCss(table, coordinates, contentDivSelector);

    let styleElement = doc.getElementById(STYLE_ID + core.contentDiv.id) as HTMLStyleElement;
    if (!styleElement) {
        styleElement = doc.createElement('style');
        doc.head.appendChild(styleElement);
        styleElement.id = STYLE_ID + core.contentDiv.id;
    }
    styleElement.sheet.insertRule(css);

    return ranges;
}

function unselect(doc: Document) {
    let styleElement = doc.getElementById(STYLE_ID + CONTENT_DIV_ID) as HTMLStyleElement;
    if (styleElement?.sheet?.cssRules) {
        while (styleElement.sheet.cssRules.length > 0) {
            styleElement.sheet.deleteRule(0);
        }
    }
}

/**
 * Make the first Cell of a table selection always be on top of the last cell.
 * @param input Table selection
 * @returns Table Selection where the first cell is always going to be first selected in the table
 * and the last cell always going to be last selected in the table.
 */
function normalizeTableSelection(input: TableSelection, table: HTMLTableElement): TableSelection {
    const { firstCell, lastCell } = input;

    let newFirst = {
        x: Math.min(firstCell.x, lastCell.x),
        y: Math.min(firstCell.y, lastCell.y),
    };
    let newLast = {
        x: Math.max(firstCell.x, lastCell.x),
        y: Math.max(firstCell.y, lastCell.y),
    };

    const checkIfExists = (coord: Coordinates) => table.rows.item(coord.y).cells.item(coord.x);

    if (!checkIfExists(newFirst) || !checkIfExists(newLast)) {
        throw new Error('Table selection provided is not valid');
    }

    return { firstCell: newFirst, lastCell: newLast };
}

function ensureUniqueId(el: HTMLElement, idPrefix: string) {
    if (el && !el.id) {
        const doc = el.ownerDocument;
        const getElement = (doc: Document) => doc.getElementById(idPrefix + cont);
        let cont = 0;
        //Ensure that there are no elements with the same ID
        let element = getElement(doc);
        while (element) {
            element = getElement(doc);
            cont++;
        }

        el.id = idPrefix + cont;
    }
}
function generateCssFromCell(
    contentDivSelector: string,
    tableId: string,
    middleElSelector: string,
    rowIndex: number,
    cellTag: string,
    index: number
): string {
    return (
        contentDivSelector +
        ' #' +
        tableId +
        middleElSelector +
        ' tr:nth-child(' +
        rowIndex +
        ')>' +
        cellTag +
        ':nth-child(' +
        index +
        ')'
    );
}
