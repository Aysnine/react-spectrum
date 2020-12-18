/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Direction, KeyboardDelegate, Node} from '@react-types/shared';
import {Key, RefObject} from 'react';
import {Layout, Rect} from '@react-stately/virtualizer';
import {GridCollection} from '@react-types/grid';

export interface GridKeyboardDelegateOptions<T, C extends GridCollection<T>> {
  collection: C,
  disabledKeys: Set<Key>,
  ref?: RefObject<HTMLElement>,
  direction: Direction,
  collator?: Intl.Collator,
  layout?: Layout<Node<T>>
}

export class GridKeyboardDelegate<T, C extends GridCollection<T>> implements KeyboardDelegate {
  collection: C;
  private disabledKeys: Set<Key>;
  private ref: RefObject<HTMLElement>;
  private direction: Direction;
  private collator: Intl.Collator;
  private layout: Layout<Node<T>>;

  constructor(options: GridKeyboardDelegateOptions<T, C>) {
    this.collection = options.collection;
    this.disabledKeys = options.disabledKeys;
    this.ref = options.ref;
    this.direction = options.direction;
    this.collator = options.collator;
    this.layout = options.layout;
  }

  protected isCell(node: Node<T>) {
    return node.type === 'cell';
    // return node.type === 'cell' || node.type === 'rowheader';
  }

  private findPreviousKey(fromKey?: Key) {
    let key = fromKey != null
      ? this.collection.getKeyBefore(fromKey)
      : this.collection.getLastKey();

    return key;
  }

  private findNextKey(fromKey?: Key) {
    let key = fromKey != null
      ? this.collection.getKeyAfter(fromKey)
      : this.collection.getFirstKey();
    return key;
  }

  getKeyBelow(key: Key) {
    let startItem = this.collection.getItem(key);
    if (!startItem) {
      return;
    }

    // If focus was on a cell, start searching from the parent row
    if (this.isCell(startItem)) {
      key = startItem.parentKey;
    }

    // Find the next item
    key = this.findNextKey(key);
    if (key != null) {
      // If focus was on a cell, focus the cell with the same index in the next row.
      if (this.isCell(startItem)) {
        let item = this.collection.getItem(key);
        return [...item.childNodes][startItem.index].key;
      }

      // Otherwise, focus the next row
      return key;
    }
  }

  getKeyAbove(key: Key) {
    let startItem = this.collection.getItem(key);
    if (!startItem) {
      return;
    }

    // If focus is on a cell, start searching from the parent row
    if (this.isCell(startItem)) {
      key = startItem.parentKey;
    }

    // Find the previous item
    key = this.findPreviousKey(key);
    if (key != null) {
      // If focus was on a cell, focus the cell with the same index in the previous row.
      if (this.isCell(startItem)) {
        let item = this.collection.getItem(key);
        return [...item.childNodes][startItem.index].key;
      }

      // Otherwise, focus the previous row
      return key;
    }
  }

  getKeyRightOf(key: Key) {
    let item = this.collection.getItem(key);
    if (!item) {
      return;
    }

    // If focus is on a row, focus the first child cell.
    if (item.type === 'item') {   // TODO change this to item.type !== 'cell' ??
      let children = [...item.childNodes];
      return this.direction === 'rtl'
        ? children[children.length - 1].key
        : children[0].key;
    }

    // If focus is on a cell, focus the next cell if any,
    // otherwise focus the parent row.
    if (this.isCell(item)) {
      let parent = this.collection.getItem(item.parentKey);
      let children = [...parent.childNodes];
      let next = this.direction === 'rtl'
        ? children[item.index - 1]
        : children[item.index + 1];

      if (next) {
        return next.key;
      }

      return item.parentKey;
    }
  }

  getKeyLeftOf(key: Key) {
    let item = this.collection.getItem(key);
    if (!item) {
      return;
    }

    // If focus is on a row, focus the last child cell.
    if (item.type === 'item') {
      let children = [...item.childNodes];
      return this.direction === 'rtl'
        ? children[0].key
        : children[children.length - 1].key;
    }

    // If focus is on a cell, focus the previous cell if any,
    // otherwise focus the parent row.
    if (this.isCell(item)) {
      let parent = this.collection.getItem(item.parentKey);
      let children = [...parent.childNodes];
      let prev = this.direction === 'rtl'
        ? children[item.index + 1]
        : children[item.index - 1];

      if (prev) {
        return prev.key;
      }

      return parent.key;
    }
  }

  getFirstKey(key?: Key, global?: boolean) {
    let item: Node<T>;
    if (key != null) {
      item = this.collection.getItem(key);
      if (!item) {
        return;
      }

      // If global flag is not set, and a cell is currently focused,
      // move focus to the first cell in the parent row.
      if (this.isCell(item) && !global) {
        let parent = this.collection.getItem(item.parentKey);
        return [...parent.childNodes][0].key;
      }
    }

    // Find the first row
    key = this.findNextKey();

    // If global flag is set, focus the first cell in the first row.
    if (key != null && item && this.isCell(item) && global) {
      let item = this.collection.getItem(key);
      key = [...item.childNodes][0].key;
    }

    // Otherwise, focus the row itself.
    return key;
  }

  getLastKey(key?: Key, global?: boolean) {
    let item: Node<T>;
    if (key != null) {
      item = this.collection.getItem(key);
      if (!item) {
        return;
      }

      // If global flag is not set, and a cell is currently focused,
      // move focus to the last cell in the parent row.
      if (this.isCell(item) && !global) {
        let parent = this.collection.getItem(item.parentKey);
        let children = [...parent.childNodes];
        return children[children.length - 1].key;
      }
    }

    // Find the last row
    key = this.findPreviousKey();

    // If global flag is set, focus the last cell in the last row.
    if (key != null && item && this.isCell(item) && global) {
      let item = this.collection.getItem(key);
      let children = [...item.childNodes];
      key = children[children.length - 1].key;
    }

    // Otherwise, focus the row itself.
    return key;
  }

  private getItem(key: Key): HTMLElement {
    return this.ref.current.querySelector(`[data-key="${key}"]`);
  }

  private getItemRect(key: Key): Rect {
    if (this.layout) {
      return this.layout.getLayoutInfo(key)?.rect;
    }

    let item = this.getItem(key);
    if (item) {
      return new Rect(item.offsetLeft, item.offsetTop, item.offsetWidth, item.offsetHeight);
    }
  }

  private getPageHeight(): number {
    if (this.layout) {
      return this.layout.virtualizer?.visibleRect.height;
    }

    return this.ref?.current?.offsetHeight;
  }

  private getContentHeight(): number {
    if (this.layout) {
      return this.layout.getContentSize().height;
    }

    return this.ref?.current?.scrollHeight;
  }

  getKeyPageAbove(key: Key) {
    let itemRect = this.getItemRect(key);
    if (!itemRect) {
      return null;
    }

    let pageY = Math.max(0, itemRect.maxY - this.getPageHeight());

    while (itemRect && itemRect.y > pageY) {
      key = this.getKeyAbove(key);
      itemRect = this.getItemRect(key);
    }

    return key;
  }

  getKeyPageBelow(key: Key) {
    let itemRect = this.getItemRect(key);

    if (!itemRect) {
      return null;
    }

    let pageHeight = this.getPageHeight();
    let pageY = Math.min(this.getContentHeight(), itemRect.y + pageHeight);

    while (itemRect && itemRect.maxY < pageY) {
      let nextKey = this.getKeyBelow(key);
      itemRect = this.getItemRect(nextKey);

      // Guard against case where maxY of the last key is barely less than pageY due to rounding
      // and thus it attempts to set key to null
      if (nextKey != null) {
        key = nextKey;
      }
    }

    return key;
  }

  // TODO unsure what this does
  getKeyForSearch(search: string, fromKey?: Key) {
    if (!this.collator) {
      return null;
    }

    let collection = this.collection;
    let key = fromKey ?? this.getFirstKey();

    // If the starting key is a cell, search from its parent row.
    let startItem = collection.getItem(key);
    if (startItem.type === 'cell') {
      key = startItem.parentKey;
    }

    let hasWrapped = false;
    while (key != null) {
      key = this.getKeyBelow(key);

      // Wrap around when reaching the end of the collection
      if (key == null && !hasWrapped) {
        key = this.getFirstKey();
        hasWrapped = true;
      }
    }

    return null;
  }
}