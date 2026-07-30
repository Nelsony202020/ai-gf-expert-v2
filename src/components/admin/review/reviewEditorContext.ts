import { createContext } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import type { PickedMedia } from './MediaPickerModal';

export type ImageInspectorTarget = {
  kind: 'image' | 'imageRow';
  updateAttributes: NodeViewProps['updateAttributes'];
  attrs: Record<string, unknown>;
  itemIndex?: number;
  pairWithNext?: () => void;
};

export interface ReviewEditorUI {
  openImagePicker: (onPick: (media: PickedMedia) => void) => void;
  openImageInspector: (target: ImageInspectorTarget) => void;
}

export const ReviewEditorUIContext = createContext<ReviewEditorUI>({
  openImagePicker: () => {},
  openImageInspector: () => {},
});
