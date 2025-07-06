
(function() {
    var platform = window.pywebview.platform;
    var disableText = '%(text_select)s' === 'False';
    var disableTextCss = 'body {-webkit-user-select: none; -khtml-user-select: none; -ms-user-select: none; user-select: none; cursor: default;}'

    if (platform == 'mshtml') {
        window.alert = function(msg) {
            window.external.alert(msg);
        }
    } else if (platform == 'edgechromium') {
        window.alert = function (message) {
            window.chrome.webview.postMessage(['_pywebviewAlert', pywebview.stringify(message), 'alert']);
        }
    } else if (platform == 'gtkwebkit2') {
        window.alert = function (message) {
            window.webkit.messageHandlers.jsBridge.postMessage(pywebview.stringify({funcName: '_pywebviewAlert', params: message, id: 'alert'}));
        }
    } else if (platform == 'cocoa') {
        window.print = function() {
            window.webkit.messageHandlers.browserDelegate.postMessage('print');
        }
    } else if (platform === 'qtwebengine') {
        window.alert = function (message) {
            window.pywebview._QWebChannel.objects.external.call('_pywebviewAlert', pywebview.stringify(message), 'alert');
        }
    } else if (platform === 'qtwebkit') {
        window.alert = function (message) {
            window.external.invoke(JSON.stringify(['_pywebviewAlert', message, 'alert']));
        }
    }

    if (disableText) {
        var css = document.createElement("style");
        css.type = "text/css";
        css.innerHTML = disableTextCss;
        document.head.appendChild(css);
    }

    function disableTouchEvents() {
        var initialX = 0;
        var initialY = 0;

        function onMouseMove(ev) {
            var x = ev.screenX - initialX;
            var y = ev.screenY - initialY;
            window.pywebview._jsApiCallback('pywebviewMoveWindow', [x, y], 'move');
        }

        function onMouseUp() {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }

        function onMouseDown(ev) {
            initialX = ev.clientX;
            initialY = ev.clientY;

            if (
                platform === 'gtkwebkit2' ||
                platform === 'qtwebengine' ||
                platform === 'qtwebkit' ||
                platform === 'cocoa'
            ) {
                window.pywebview._jsApiCallback('pywebviewBeginDrag', null, 'beginDrag');
                return;
            }

            window.addEventListener('mouseup', onMouseUp);
            window.addEventListener('mousemove', onMouseMove);
        }

        function addDragListenerToElement(element) {
            if (element.hasAttribute('data-pywebview-drag-listener')) return

            element.addEventListener('mousedown', onMouseDown);
            element.setAttribute('data-pywebview-drag-listener', 'true');
        }

        function addDragListeners(element) {
            if (element.matches && element.matches('%(drag_selector)s')) {
                addDragListenerToElement(element);
            }

            var matchingChildren = element.querySelectorAll('%(drag_selector)s');
            matchingChildren.forEach(function(child) {
                addDragListenerToElement(child);
            });
        }

        function addDraggableAttributes(element) {
            if (element.matches('img, a')) {
                element.setAttribute("draggable", false);
            }

            var matchingChildren = element.querySelectorAll('img, a');
            matchingChildren.forEach(function(child) {
                child.setAttribute("draggable", false);
            });
        }

        var dragBlocks = document.querySelectorAll('%(drag_selector)s');
        for (var i=0; i < dragBlocks.length; i++) {
            addDragListenerToElement(dragBlocks[i]);
        }

        // Set up MutationObserver to watch for new elements
        if (window.MutationObserver) {
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType !== Node.ELEMENT_NODE) return

                        addDragListeners(node);

                        if ('%(draggable)s' === 'False') {
                            addDraggableAttributes(node);
                        }
                    });
                });
            });

            // Start observing the document for added child nodes
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
            // easy drag for edge chromium
        if ('%(easy_drag)s' === 'True') {
            window.addEventListener('mousedown', onMouseDown);
        }

        if ('%(zoomable)s' === 'False') {
            document.body.addEventListener('touchstart', function(e) {
                if ((e.touches.length > 1) || e.targetTouches.length > 1) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
            }, {passive: false});

            window.addEventListener('wheel', function (e) {
                if (e.ctrlKey) {
                    e.preventDefault();
                }
            }, {passive: false});
        }

        // draggable
        if ('%(draggable)s' === 'False') {
            Array.prototype.slice.call(document.querySelectorAll("img, a")).forEach(function(element) {
                element.setAttribute("draggable", false);
            });
        }
    }

    disableTouchEvents();
  })();

