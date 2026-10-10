// The host config: how React's reconciler builds and changes the tree of
// nodes. Like Ink's, it is a mutating renderer with nothing to hydrate.
import createReconciler from 'react-reconciler';
// Node resolves a package's inner file only by its full name.
// eslint-disable-next-line import/extensions
import {DefaultEventPriority} from 'react-reconciler/constants.js';
import type {ReactNode} from 'react';
import {TEXT, createNode, createString} from './nodes';
import type {HostType, Node, NodeProps} from './nodes';

/** Whether strings may be here: only inside a text node. */
interface HostContext {
  insideText: boolean;
}

/** An element's props as React hands them over. */
type Props = NodeProps & {children?: ReactNode};

const NO_CONTEXT: HostContext = {insideText: false};
const TEXT_CONTEXT: HostContext = {insideText: true};

// Children are React's business, not a node's.
function withoutChildren({children, ...props}: Props): NodeProps {
  return props;
}

export default createReconciler<
  HostType, // Type
  Props, // Props
  Node, // Container
  Node, // Instance
  Node, // TextInstance
  never, // SuspenseInstance
  never, // HydratableInstance
  Node, // PublicInstance
  HostContext, // HostContext
  boolean, // UpdatePayload
  never, // ChildSet
  ReturnType<typeof setTimeout>, // TimeoutHandle
  -1 // NoTimeout
>({
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  isPrimaryRenderer: true,
  noTimeout: -1,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,

  getRootHostContext: () => NO_CONTEXT,
  getChildHostContext: (parent, type) => (type === TEXT ? TEXT_CONTEXT : NO_CONTEXT),
  getPublicInstance: (instance) => instance,
  getCurrentEventPriority: () => DefaultEventPriority,
  shouldSetTextContent: () => false,

  createInstance: (type, props) => createNode(type, withoutChildren(props)),
  createTextInstance(text, root, context) {
    if (!context.insideText) {
      throw new Error(`the string ${JSON.stringify(text)} must be inside a <Text>`);
    }
    return createString(text);
  },

  appendInitialChild: (parent, child) => parent.append(child),
  appendChild: (parent, child) => parent.append(child),
  appendChildToContainer: (container, child) => container.append(child),
  insertBefore: (parent, child, before) => parent.insertBefore(child, before),
  insertInContainerBefore: (container, child, before) => container.insertBefore(child, before),
  removeChild: (parent, child) => parent.remove(child),
  removeChildFromContainer: (container, child) => container.remove(child),
  clearContainer(container) {
    container.children.slice().forEach((child) => container.remove(child));
  },

  finalizeInitialChildren: () => false,
  prepareUpdate: () => true,
  commitUpdate(instance, payload, type, oldProps, newProps) {
    instance.setProps(withoutChildren(newProps));
  },
  commitTextUpdate(instance, oldText, newText) {
    instance.setValue(newText);
  },
  resetTextContent() {},

  prepareForCommit: () => null,
  resetAfterCommit(container) {
    if (container.onCommit) {
      container.onCommit();
    }
  },
  preparePortalMount() {},
  detachDeletedInstance() {},
  hideInstance: (instance) => instance.setHidden(true),
  unhideInstance: (instance) => instance.setHidden(false),
  hideTextInstance: (instance) => instance.setHidden(true),
  unhideTextInstance: (instance) => instance.setHidden(false),

  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur() {},
  afterActiveInstanceBlur() {},
  prepareScopeUpdate() {},
  getInstanceFromScope: () => null,
});
