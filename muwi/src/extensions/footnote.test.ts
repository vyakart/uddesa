import { Footnote } from './footnote';

describe('Footnote extension', () => {
  it('provides defaults, attributes, parser, and HTML rendering', () => {
    const options = Footnote.config.addOptions?.call(Footnote);
    expect(options).toEqual({
      HTMLAttributes: {},
      onFootnoteClick: undefined,
    });

    const attributes = Footnote.config.addAttributes?.call(Footnote);
    expect(attributes).toBeDefined();

    const idAttrs = attributes!.id;
    const markerAttrs = attributes!.marker;

    expect(idAttrs.renderHTML({ id: null })).toEqual({});
    expect(idAttrs.renderHTML({ id: 'fn-1' })).toEqual({ 'data-footnote-id': 'fn-1' });
    expect(
      idAttrs.parseHTML({ getAttribute: (name: string) => (name === 'data-footnote-id' ? 'fn-2' : null) } as Element)
    ).toBe('fn-2');

    expect(
      markerAttrs.parseHTML({ getAttribute: (name: string) => (name === 'data-footnote-marker' ? '5' : null) } as Element)
    ).toBe(5);
    expect(
      markerAttrs.parseHTML({ getAttribute: () => null } as Element)
    ).toBe(1);
    expect(markerAttrs.renderHTML({ marker: 9 })).toEqual({ 'data-footnote-marker': 9 });

    expect(Footnote.config.parseHTML?.call(Footnote)).toEqual([{ tag: 'sup[data-footnote-id]' }]);

    const rendered = Footnote.config.renderHTML?.call(Footnote, {
      HTMLAttributes: { 'data-footnote-id': 'fn-3', 'data-footnote-marker': 7 },
    });

    expect(rendered?.[0]).toBe('sup');
    expect(rendered?.[2]).toBe('[7]');

    const renderedFallback = Footnote.config.renderHTML?.call(Footnote, {
      HTMLAttributes: {},
    });
    expect(renderedFallback?.[2]).toBe('[?]');
  });

  it('inserts, removes, and updates footnotes through commands', () => {
    const commands = Footnote.config.addCommands?.call(Footnote);
    expect(commands).toBeDefined();

    const insertContent = vi.fn();
    const inserted = commands!.insertFootnote('fn-1', 3)({ commands: { insertContent } });
    expect(inserted).toBe(true);
    expect(insertContent).toHaveBeenCalledWith({
      type: 'text',
      text: '\u200B',
      marks: [{ type: 'footnote', attrs: { id: 'fn-1', marker: 3 } }],
    });

    const tr = {
      delete: vi.fn(),
      removeMark: vi.fn(),
      addMark: vi.fn(),
    };

    const markType = {
      name: 'footnote',
      create: vi.fn().mockReturnValue({ type: 'new-footnote-mark' }),
    };

    const state = {
      doc: {
        descendants: (cb: (node: unknown, pos: number) => void) => {
          cb(
            {
              isText: true,
              nodeSize: 1,
              marks: [
                { type: markType, attrs: { id: 'fn-1', marker: 3 } },
              ],
            },
            12
          );
        },
      },
    };

    const removed = commands!.removeFootnote('fn-1')({
      tr,
      state,
      dispatch: vi.fn(),
    });
    expect(removed).toBe(true);
    expect(tr.delete).toHaveBeenCalledWith(12, 13);

    const updated = commands!.updateFootnoteMarker('fn-1', 10)({
      tr,
      state,
      dispatch: vi.fn(),
    });
    expect(updated).toBe(true);
    expect(markType.create).toHaveBeenCalledWith({ id: 'fn-1', marker: 10 });
    expect(tr.removeMark).toHaveBeenCalled();
    expect(tr.addMark).toHaveBeenCalled();

    const noHitState = {
      doc: {
        descendants: (cb: (node: unknown, pos: number) => void) => {
          cb({ isText: true, nodeSize: 1, marks: [] }, 4);
        },
      },
    };

    expect(commands!.removeFootnote('missing')({ tr, state: noHitState })).toBe(false);
    expect(commands!.updateFootnoteMarker('missing', 2)({ tr, state: noHitState })).toBe(false);
  });

  it('handles footnote click plugin behavior', () => {
    const onFootnoteClick = vi.fn();
    const plugins = Footnote.config.addProseMirrorPlugins?.call({
      options: { onFootnoteClick },
    });
    expect(plugins).toHaveLength(1);

    const clickHandler = plugins![0].props.handleClick;
    expect(clickHandler).toBeDefined();

    const event = { preventDefault: vi.fn() } as unknown as MouseEvent;

    const handled = clickHandler!(
      {
        state: {
          doc: {
            resolve: () => ({
              nodeAfter: {
                isText: true,
                marks: [{ type: { name: 'footnote' }, attrs: { id: 'fn-click' } }],
              },
              nodeBefore: null,
            }),
          },
        },
      } as never,
      8,
      event
    );

    expect(handled).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onFootnoteClick).toHaveBeenCalledWith('fn-click');

    const notHandled = clickHandler!(
      {
        state: {
          doc: {
            resolve: () => ({
              nodeAfter: { isText: true, marks: [] },
              nodeBefore: null,
            }),
          },
        },
      } as never,
      3,
      { preventDefault: vi.fn() } as unknown as MouseEvent
    );

    expect(notHandled).toBe(false);
  });
});
