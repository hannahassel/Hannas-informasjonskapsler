
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35731/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.46.4 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (48:2) {#each nasjonalitet as land}
    function create_each_block(ctx) {
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let t3_value = /*land*/ ctx[9].country_id + "";
    	let t3;
    	let t4;
    	let t5_value = /*land*/ ctx[9].probability * 100 + "";
    	let t5;
    	let t6;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Vi kan si at ");
    			t1 = text(/*navn*/ ctx[1]);
    			t2 = text(" kommer fra: ");
    			t3 = text(t3_value);
    			t4 = text(" med en sikkerhet på ");
    			t5 = text(t5_value);
    			t6 = text("%");
    			add_location(p, file, 49, 2, 964);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(p, t5);
    			append_dev(p, t6);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*navn*/ 2) set_data_dev(t1, /*navn*/ ctx[1]);
    			if (dirty & /*nasjonalitet*/ 1 && t3_value !== (t3_value = /*land*/ ctx[9].country_id + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*nasjonalitet*/ 1 && t5_value !== (t5_value = /*land*/ ctx[9].probability * 100 + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(48:2) {#each nasjonalitet as land}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h2;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let br3;
    	let t5;
    	let div0;
    	let h10;
    	let t7;
    	let p0;
    	let t9;
    	let input_1;
    	let t10;
    	let button0;
    	let t12;
    	let t13;
    	let br4;
    	let t14;
    	let br5;
    	let t15;
    	let br6;
    	let t16;
    	let br7;
    	let t17;
    	let h11;
    	let t19;
    	let div1;
    	let p1;
    	let t20;
    	let t21;
    	let button1;
    	let t23;
    	let br8;
    	let t24;
    	let br9;
    	let t25;
    	let br10;
    	let t26;
    	let p2;
    	let t28;
    	let br11;
    	let t29;
    	let div2;
    	let h12;
    	let t31;
    	let img;
    	let img_src_value;
    	let t32;
    	let br12;
    	let t33;
    	let br13;
    	let t34;
    	let br14;
    	let t35;
    	let button2;
    	let t37;
    	let h13;
    	let t39;
    	let br15;
    	let t40;
    	let br16;
    	let t41;
    	let br17;
    	let t42;
    	let br18;
    	let mounted;
    	let dispose;
    	let each_value = /*nasjonalitet*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "Hannas informasjonskaplser! ";
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			br3 = element("br");
    			t5 = space();
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Hvilken nasjonalitet er du??????????";
    			t7 = space();
    			p0 = element("p");
    			p0.textContent = "Hvilken nasjonalitet er du basert på navnet ditt?????";
    			t9 = space();
    			input_1 = element("input");
    			t10 = space();
    			button0 = element("button");
    			button0.textContent = "Kalkuler";
    			t12 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t13 = space();
    			br4 = element("br");
    			t14 = space();
    			br5 = element("br");
    			t15 = space();
    			br6 = element("br");
    			t16 = space();
    			br7 = element("br");
    			t17 = space();
    			h11 = element("h1");
    			h11.textContent = "Vil du ha en joke????????";
    			t19 = space();
    			div1 = element("div");
    			p1 = element("p");
    			t20 = text(/*joke*/ ctx[3]);
    			t21 = space();
    			button1 = element("button");
    			button1.textContent = "ny vits!!!!";
    			t23 = space();
    			br8 = element("br");
    			t24 = space();
    			br9 = element("br");
    			t25 = space();
    			br10 = element("br");
    			t26 = space();
    			p2 = element("p");
    			p2.textContent = `${localStorage.BAR}`;
    			t28 = space();
    			br11 = element("br");
    			t29 = space();
    			div2 = element("div");
    			h12 = element("h1");
    			h12.textContent = "Se på disse kule dogene!!!!!!!";
    			t31 = space();
    			img = element("img");
    			t32 = space();
    			br12 = element("br");
    			t33 = space();
    			br13 = element("br");
    			t34 = space();
    			br14 = element("br");
    			t35 = space();
    			button2 = element("button");
    			button2.textContent = "ny hund!!!!!";
    			t37 = space();
    			h13 = element("h1");
    			h13.textContent = "Håper du likte siden min!!!!!!!!!!!!!!!!!!!!";
    			t39 = space();
    			br15 = element("br");
    			t40 = space();
    			br16 = element("br");
    			t41 = space();
    			br17 = element("br");
    			t42 = space();
    			br18 = element("br");
    			attr_dev(h2, "class", "svelte-y3sg2f");
    			add_location(h2, file, 34, 0, 653);
    			add_location(br0, file, 35, 0, 691);
    			add_location(br1, file, 36, 0, 696);
    			add_location(br2, file, 37, 0, 701);
    			add_location(br3, file, 38, 0, 706);
    			add_location(h10, file, 41, 1, 732);
    			add_location(p0, file, 42, 2, 780);
    			add_location(input_1, file, 43, 2, 843);
    			add_location(button0, file, 44, 2, 872);
    			attr_dev(div0, "class", "nasj");
    			add_location(div0, file, 40, 0, 712);
    			add_location(br4, file, 54, 0, 1090);
    			add_location(br5, file, 55, 0, 1095);
    			add_location(br6, file, 56, 0, 1100);
    			add_location(br7, file, 57, 0, 1105);
    			add_location(h11, file, 58, 0, 1110);
    			add_location(p1, file, 62, 3, 1172);
    			add_location(button1, file, 63, 3, 1189);
    			attr_dev(div1, "class", "rasj");
    			add_location(div1, file, 60, 1, 1147);
    			add_location(br8, file, 66, 1, 1247);
    			add_location(br9, file, 67, 1, 1253);
    			add_location(br10, file, 68, 1, 1259);
    			add_location(p2, file, 69, 1, 1265);
    			add_location(br11, file, 70, 1, 1292);
    			add_location(h12, file, 72, 1, 1315);
    			attr_dev(img, "class", "hund svelte-y3sg2f");
    			if (!src_url_equal(img.src, img_src_value = /*dog*/ ctx[4])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file, 73, 1, 1356);
    			add_location(br12, file, 74, 1, 1396);
    			add_location(br13, file, 75, 1, 1402);
    			add_location(br14, file, 76, 1, 1408);
    			add_location(button2, file, 78, 1, 1415);
    			attr_dev(div2, "class", "dog");
    			add_location(div2, file, 71, 0, 1297);
    			add_location(h13, file, 82, 0, 1472);
    			add_location(br15, file, 83, 0, 1526);
    			add_location(br16, file, 84, 0, 1531);
    			add_location(br17, file, 85, 0, 1536);
    			add_location(br18, file, 86, 0, 1541);
    			attr_dev(main, "class", "svelte-y3sg2f");
    			add_location(main, file, 32, 1, 645);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t1);
    			append_dev(main, br0);
    			append_dev(main, t2);
    			append_dev(main, br1);
    			append_dev(main, t3);
    			append_dev(main, br2);
    			append_dev(main, t4);
    			append_dev(main, br3);
    			append_dev(main, t5);
    			append_dev(main, div0);
    			append_dev(div0, h10);
    			append_dev(div0, t7);
    			append_dev(div0, p0);
    			append_dev(div0, t9);
    			append_dev(div0, input_1);
    			set_input_value(input_1, /*input*/ ctx[2]);
    			append_dev(div0, t10);
    			append_dev(div0, button0);
    			append_dev(div0, t12);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(main, t13);
    			append_dev(main, br4);
    			append_dev(main, t14);
    			append_dev(main, br5);
    			append_dev(main, t15);
    			append_dev(main, br6);
    			append_dev(main, t16);
    			append_dev(main, br7);
    			append_dev(main, t17);
    			append_dev(main, h11);
    			append_dev(main, t19);
    			append_dev(main, div1);
    			append_dev(div1, p1);
    			append_dev(p1, t20);
    			append_dev(div1, t21);
    			append_dev(div1, button1);
    			append_dev(main, t23);
    			append_dev(main, br8);
    			append_dev(main, t24);
    			append_dev(main, br9);
    			append_dev(main, t25);
    			append_dev(main, br10);
    			append_dev(main, t26);
    			append_dev(main, p2);
    			append_dev(main, t28);
    			append_dev(main, br11);
    			append_dev(main, t29);
    			append_dev(main, div2);
    			append_dev(div2, h12);
    			append_dev(div2, t31);
    			append_dev(div2, img);
    			append_dev(div2, t32);
    			append_dev(div2, br12);
    			append_dev(div2, t33);
    			append_dev(div2, br13);
    			append_dev(div2, t34);
    			append_dev(div2, br14);
    			append_dev(div2, t35);
    			append_dev(div2, button2);
    			append_dev(main, t37);
    			append_dev(main, h13);
    			append_dev(main, t39);
    			append_dev(main, br15);
    			append_dev(main, t40);
    			append_dev(main, br16);
    			append_dev(main, t41);
    			append_dev(main, br17);
    			append_dev(main, t42);
    			append_dev(main, br18);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[8]),
    					listen_dev(button0, "click", /*getnasjonalitet*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*getJoke*/ ctx[6], false, false, false),
    					listen_dev(button2, "click", /*getDog*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*input*/ 4 && input_1.value !== /*input*/ ctx[2]) {
    				set_input_value(input_1, /*input*/ ctx[2]);
    			}

    			if (dirty & /*nasjonalitet, navn*/ 3) {
    				each_value = /*nasjonalitet*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*joke*/ 8) set_data_dev(t20, /*joke*/ ctx[3]);

    			if (dirty & /*dog*/ 16 && !src_url_equal(img.src, img_src_value = /*dog*/ ctx[4])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let nasjonalitet = [];
    	let navn;
    	let input;

    	const getnasjonalitet = async () => {
    		const url = 'https://api.nationalize.io?name=' + input;
    		const data = await fetch(url);
    		const json = await data.json();
    		$$invalidate(0, nasjonalitet = json.country);
    		$$invalidate(1, navn = input);
    	};

    	getnasjonalitet();
    	let joke;

    	const getJoke = async () => {
    		const data = await fetch("https://api.chucknorris.io/jokes/random");
    		const json = await data.json();
    		$$invalidate(3, joke = json.value);
    	};

    	getJoke();
    	let dog;

    	const getDog = async () => {
    		const data = await fetch("https://dog.ceo/api/breeds/image/random");
    		const json = await data.json();
    		$$invalidate(4, dog = json.message);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_1_input_handler() {
    		input = this.value;
    		$$invalidate(2, input);
    	}

    	$$self.$capture_state = () => ({
    		nasjonalitet,
    		navn,
    		input,
    		getnasjonalitet,
    		joke,
    		getJoke,
    		dog,
    		getDog
    	});

    	$$self.$inject_state = $$props => {
    		if ('nasjonalitet' in $$props) $$invalidate(0, nasjonalitet = $$props.nasjonalitet);
    		if ('navn' in $$props) $$invalidate(1, navn = $$props.navn);
    		if ('input' in $$props) $$invalidate(2, input = $$props.input);
    		if ('joke' in $$props) $$invalidate(3, joke = $$props.joke);
    		if ('dog' in $$props) $$invalidate(4, dog = $$props.dog);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		nasjonalitet,
    		navn,
    		input,
    		joke,
    		dog,
    		getnasjonalitet,
    		getJoke,
    		getDog,
    		input_1_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
