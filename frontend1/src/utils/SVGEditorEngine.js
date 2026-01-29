export class SVGLoader {
    constructor() {
        this.svgDocument = null;
    }
    async loadFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const parser = new DOMParser();
                try {
                    const svgDoc = parser.parseFromString(event.target.result, "image/svg+xml");
                    this.svgDocument = svgDoc;
                    resolve(svgDoc);
                } catch (error) {
                    reject(new Error("Failed to parse SVG file"));
                }
            };

            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsText(file);
        });
    }

    // Load SVG from URL
    async loadFromURL(url) {
        try {
            const response = await fetch(url);
            const svgText = await response.text();
            const parser = new DOMParser();
            this.svgDocument = parser.parseFromString(svgText, "image/svg+xml");
            return this.svgDocument;
        } catch (error) {
            throw new Error("Failed to load SVG from URL");
        }
    }
}
// ----- Element Selection and Manipulation Component -----
export class ElementManager {
    constructor(svgEditor) {
        this.svgEditor = svgEditor;
        this.selectedElements = [];
        this.draggedElement = null;
        this.initialDragPos = { x: 0, y: 0 };
        this.initialElementPos = { x: 0, y: 0 };
        this.resizingElement = null;
    }
    //***
    // make walls draggable
    dragMoveHandler(event) {
        if (!this.draggedElement) return;

        const dx = event.clientX - this.initialDragPos.x;
        const dy = event.clientY - this.initialDragPos.y;

        // Apply the new translation
        const newX = this.initialElementPos.x + dx;
        const newY = this.initialElementPos.y + dy;

        this.draggedElement.setAttribute('transform', `translate(${newX},${newY})`);
    }
    //** */
    createwallButton = document.getElementById('create-wall-button');
    // create new wall
    createWall() {
        const wall = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        wall.setAttribute('x', '0');
        wall.setAttribute('y', '0');
        wall.setAttribute('width', '100');
        wall.setAttribute('height', '100');
        wall.setAttribute('fill', 'none');
        wall.setAttribute('stroke', 'black');
        wall.setAttribute('stroke-width', '2');
        this.svgEditor.svg.appendChild(wall);
    }
    // Select an element
    selectElement(element) {
        this.deselectAll();
        this.selectedElements.push(element);
        this.highlightSelected();
        this.svgEditor.updatePropertiesPanel();
    }

    // Select multiple elements
    selectMultiple(elements) {
        this.deselectAll();
        this.selectedElements = [...elements];
        this.highlightSelected();
        this.svgEditor.updatePropertiesPanel();
    }

    // Deselect all elements
    deselectAll() {
        this.selectedElements.forEach(el => {
            // Remove selection styling
            el.classList.remove('selected');
        });

        // Remove resize handles
        const handles = document.querySelectorAll('.resize-handle');
        handles.forEach(handle => handle.remove());

        this.selectedElements = [];
    }

    // Highlight selected elements
    highlightSelected() {
        this.selectedElements.forEach(el => {
            el.classList.add('selected');
            this.addResizeHandles(el);
        });
    }

    // Add resize handles to selected element
    addResizeHandles(element) {
        // Remove any existing handles first
        const existingHandles = document.querySelectorAll('.resize-handle');
        existingHandles.forEach(handle => handle.remove());

        // Skip if it's a non-visible element
        if (element.tagName === 'defs' || element.tagName === 'style') {
            return;
        }

        // Get the bounding box of the element
        const bbox = element.getBBox();

        // Define the positions for the 8 handles (4 corners + 4 midpoints)
        const handles = [
            { x: bbox.x, y: bbox.y, cursor: 'nwse-resize', position: 'tl' }, // Top-left
            { x: bbox.x + bbox.width / 2, y: bbox.y, cursor: 'ns-resize', position: 't' }, // Top-center
            { x: bbox.x + bbox.width, y: bbox.y, cursor: 'nesw-resize', position: 'tr' }, // Top-right
            { x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2, cursor: 'ew-resize', position: 'r' }, // Right-center
            { x: bbox.x + bbox.width, y: bbox.y + bbox.height, cursor: 'nwse-resize', position: 'br' }, // Bottom-right
            { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height, cursor: 'ns-resize', position: 'b' }, // Bottom-center
            { x: bbox.x, y: bbox.y + bbox.height, cursor: 'nesw-resize', position: 'bl' }, // Bottom-left
            { x: bbox.x, y: bbox.y + bbox.height / 2, cursor: 'ew-resize', position: 'l' } // Left-center
        ];

        // Create a group for the handles
        const handlesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        handlesGroup.setAttribute('class', 'resize-handles-group');

        // Create each handle
        handles.forEach((handlePos, index) => {
            const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            handle.setAttribute('x', handlePos.x - 5);
            handle.setAttribute('y', handlePos.y - 5);
            handle.setAttribute('width', 10);
            handle.setAttribute('height', 10);
            handle.setAttribute('fill', '#0066ff');
            handle.setAttribute('stroke', 'white');
            handle.setAttribute('stroke-width', 2);
            handle.setAttribute('class', 'resize-handle');
            handle.setAttribute('data-handle-index', index);
            handle.setAttribute('data-position', handlePos.position);
            handle.style.cursor = handlePos.cursor;

            // Add to the group
            handlesGroup.appendChild(handle);

            // Add event listeners for resizing
            this.setupResizeEvents(handle, element);
        });

        // Add the handles group to the SVG
        this.svgEditor.svgContainer.appendChild(handlesGroup);
    }

    // Setup resize events for a handle
    setupResizeEvents(handle, element) {
        handle.addEventListener('mousedown', (event) => {
            event.stopPropagation();

            // Set the resizing element
            this.resizingElement = element;

            // Get handle position
            const position = handle.getAttribute('data-position');
            const bbox = element.getBBox();

            // Store initial positions and sizes
            const initialMousePos = {
                x: event.clientX,
                y: event.clientY
            };

            const initialSize = {
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height
            };

            // Get element's current transform
            const transform = this.getElementTransform(element);

            // Handler for mouse move during resize
            const mouseMoveHandler = (moveEvent) => {
                moveEvent.preventDefault();

                // Calculate delta movement
                const dx = moveEvent.clientX - initialMousePos.x;
                const dy = moveEvent.clientY - initialMousePos.y;

                // Apply resize based on which handle was dragged
                let newX = initialSize.x;
                let newY = initialSize.y;
                let newWidth = initialSize.width;
                let newHeight = initialSize.height;

                // Adjust dimensions based on handle position
                switch (position) {
                    case 'tl': // Top-left
                        newX = initialSize.x + dx;
                        newY = initialSize.y + dy;
                        newWidth = initialSize.width - dx;
                        newHeight = initialSize.height - dy;
                        break;
                    case 't': // Top-center
                        newY = initialSize.y + dy;
                        newHeight = initialSize.height - dy;
                        break;
                    case 'tr': // Top-right
                        newY = initialSize.y + dy;
                        newWidth = initialSize.width + dx;
                        newHeight = initialSize.height - dy;
                        break;
                    case 'r': // Right-center
                        newWidth = initialSize.width + dx;
                        break;
                    case 'br': // Bottom-right
                        newWidth = initialSize.width + dx;
                        newHeight = initialSize.height + dy;
                        break;
                    case 'b': // Bottom-center
                        newHeight = initialSize.height + dy;
                        break;
                    case 'bl': // Bottom-left
                        newX = initialSize.x + dx;
                        newWidth = initialSize.width - dx;
                        newHeight = initialSize.height + dy;
                        break;
                    case 'l': // Left-center
                        newX = initialSize.x + dx;
                        newWidth = initialSize.width - dx;
                        break;
                }

                // Ensure minimum size
                if (newWidth < 5) newWidth = 5;
                if (newHeight < 5) newHeight = 5;

                // Update element based on its type
                this.resizeElement(element, {
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight,
                    transform: transform
                });
            };

            // Handler for mouse up to end resizing
            const mouseUpHandler = () => {
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
                this.resizingElement = null;

                // Refresh the handles
                this.deselectAll();
                this.selectElement(element);
            };

            // Add temporary event listeners
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        });
    }

    // Get element's current transform
    getElementTransform(element) {
        const transform = element.getAttribute('transform');
        let translateX = 0;
        let translateY = 0;

        if (transform) {
            // Extract translate values if they exist
            const translateMatch = transform.match(/translate\(([^,]+),([^)]+)\)/);
            if (translateMatch) {
                translateX = parseFloat(translateMatch[1]);
                translateY = parseFloat(translateMatch[2]);
            }
        }

        return { translateX, translateY };
    }

    // Resize element based on its type
    resizeElement(element, newDimensions) {
        const { x, y, width, height, transform } = newDimensions;

        switch (element.tagName.toLowerCase()) {
            case 'rect':
                element.setAttribute('x', x);
                element.setAttribute('y', y);
                element.setAttribute('width', width);
                element.setAttribute('height', height);
                break;

            case 'circle':
                const cx = x + width / 2;
                const cy = y + height / 2;
                // For circles, use the average of width and height for radius
                const r = Math.min(width, height) / 2;
                element.setAttribute('cx', cx);
                element.setAttribute('cy', cy);
                element.setAttribute('r', r);
                break;

            case 'ellipse':
                const ecx = x + width / 2;
                const ecy = y + height / 2;
                element.setAttribute('cx', ecx);
                element.setAttribute('cy', ecy);
                element.setAttribute('rx', width / 2);
                element.setAttribute('ry', height / 2);
                break;

            case 'line':
                // Assuming the line goes from top-left to bottom-right of its bounding box
                element.setAttribute('x1', x);
                element.setAttribute('y1', y);
                element.setAttribute('x2', x + width);
                element.setAttribute('y2', y + height);
                break;

            case 'polyline':
            case 'polygon':
                // Scale the points proportionally
                this.resizePolygonalElement(element, x, y, width, height);
                break;

            case 'path':
                // Complex path scaling - apply transform instead
                this.resizePathElement(element, x, y, width, height);
                break;

            case 'text':
                // Text elements should be moved but not resized
                element.setAttribute('x', x);
                element.setAttribute('y', y + height); // Baseline adjustment
                break;

            case 'image':
                element.setAttribute('x', x);
                element.setAttribute('y', y);
                element.setAttribute('width', width);
                element.setAttribute('height', height);
                break;

            default:
                // For other elements, apply a transform
                const bbox = element.getBBox();
                const scaleX = width / bbox.width;
                const scaleY = height / bbox.height;
                const translateX = x - (bbox.x * scaleX) + transform.translateX;
                const translateY = y - (bbox.y * scaleY) + transform.translateY;

                element.setAttribute('transform',
                    `translate(${translateX}, ${translateY}) scale(${scaleX}, ${scaleY})`);
                break;
        }

        // Refresh the resize handles
        this.addResizeHandles(element);
    }

    // Resize polygon or polyline by scaling the points
    resizePolygonalElement(element, x, y, width, height) {
        const bbox = element.getBBox();
        const scaleX = width / bbox.width;
        const scaleY = height / bbox.height;
        const offsetX = x - bbox.x;
        const offsetY = y - bbox.y;

        // Get the original points
        const points = element.getAttribute('points').trim().split(/[\s,]+/).map(parseFloat);
        const newPoints = [];

        // Transform each point
        for (let i = 0; i < points.length; i += 2) {
            if (i + 1 < points.length) {
                const px = points[i];
                const py = points[i + 1];

                // Scale and translate
                const newX = (px - bbox.x) * scaleX + x;
                const newY = (py - bbox.y) * scaleY + y;

                newPoints.push(`${newX},${newY}`);
            }
        }

        // Set the new points
        element.setAttribute('points', newPoints.join(' '));
    }

    // Resize path element using transform
    resizePathElement(element, x, y, width, height) {
        const bbox = element.getBBox();
        const scaleX = width / bbox.width;
        const scaleY = height / bbox.height;

        // For paths, we apply a transform instead of modifying the path data
        // First, get any existing transform
        const transform = this.getElementTransform(element);

        // Calculate new transform that includes the scale and position adjustment
        const translateX = x - (bbox.x * scaleX) + transform.translateX;
        const translateY = y - (bbox.y * scaleY) + transform.translateY;

        // Apply the transform
        element.setAttribute('transform',
            `translate(${translateX}, ${translateY}) scale(${scaleX}, ${scaleY})`);
    }

    // Start dragging an element
    startDragging(element, event) {
        // Don't drag if we're resizing
        if (this.resizingElement !== null) return;

        this.draggedElement = element;

        // Store initial positions
        this.initialDragPos = {
            x: event.clientX,
            y: event.clientY
        };

        // Get element's current transform or create a new one
        const transform = element.getAttribute('transform');
        let translateX = 0;
        let translateY = 0;

        if (transform) {
            // Extract translate values if they exist
            const translateMatch = transform.match(/translate\(([^,]+),([^)]+)\)/);
            if (translateMatch) {
                translateX = parseFloat(translateMatch[1]);
                translateY = parseFloat(translateMatch[2]);
            }
        }

        this.initialElementPos = {
            x: translateX,
            y: translateY
        };

        // Add event listeners for dragging
        document.addEventListener('mousemove', this.dragMoveHandler);
        document.addEventListener('mouseup', this.dragEndHandler);
    }

    // Handle element dragging
    dragMoveHandler = (event) => {
        if (!this.draggedElement) return;

        const dx = event.clientX - this.initialDragPos.x;
        const dy = event.clientY - this.initialDragPos.y;

        // Apply the new translation
        const newX = this.initialElementPos.x + dx;
        const newY = this.initialElementPos.y + dy;

        // Apply the transform
        this.draggedElement.setAttribute('transform', `translate(${newX},${newY})`);
    }

    // End element dragging
    dragEndHandler = () => {
        this.draggedElement = null;
        document.removeEventListener('mousemove', this.dragMoveHandler);
        document.removeEventListener('mouseup', this.dragEndHandler);
    }

    // Ungroup all elements in the SVG
    ungroupAll() {
        if (!this.svgEditor.svgContainer) {
            console.error("No SVG loaded");
            return;
        }

        // Find all groups in the SVG
        const groups = Array.from(this.svgEditor.svgContainer.querySelectorAll('g'));

        // Process groups from deepest nesting level first
        groups.sort((a, b) => {
            // Count nesting level
            const depthA = this.getElementDepth(a);
            const depthB = this.getElementDepth(b);
            return depthB - depthA; // Deepest first
        });

        // Ungroup each group
        groups.forEach(group => this.ungroupElement(group));

        console.log(`Ungrouped ${groups.length} groups`);

        // Refresh the view
        this.svgEditor.render();
    }

    // Get the nesting depth of an element
    getElementDepth(element) {
        let depth = 0;
        let current = element;

        while (current && current !== this.svgEditor.svgContainer) {
            depth++;
            current = current.parentNode;
        }

        return depth;
    }

    // Ungroup a single group element
    ungroupElement(group) {
        if (!group || group.tagName !== 'g') return;

        const parent = group.parentNode;
        if (!parent) return;

        // Get group transform
        const groupTransform = group.getAttribute('transform') || '';

        // Process all children
        while (group.firstChild) {
            const child = group.firstChild;

            // Apply group's transform to child
            if (groupTransform) {
                const childTransform = child.getAttribute('transform') || '';

                if (childTransform) {
                    // Combine transforms
                    child.setAttribute('transform', `${groupTransform} ${childTransform}`);
                } else {
                    child.setAttribute('transform', groupTransform);
                }
            }

            // Move child to parent
            parent.insertBefore(child, group);
        }

        // Remove empty group
        parent.removeChild(group);
    }

    // Update element properties
    updateElementProperty(property, value) {
        this.selectedElements.forEach(el => {
            el.setAttribute(property, value);
        });
    }
}

// ----- Main SVG Editor Component -----
export class SVGEditor {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.svgContainer = null;
        this.loader = new SVGLoader();
        this.elementManager = new ElementManager(this);
        this.zoomLevel = 1;
        this.panOffset = { x: 0, y: 0 };
        this.isPanning = false;
        this.lastPanPoint = { x: 0, y: 0 };

        this.initializeUI();
        this.setupEventListeners();
    }

    // Initialize the editor UI
    initializeUI() {
        // Create main UI sections
        this.container.innerHTML = `
        <div class="svg-editor-layout">
          <div class="toolbar">
            <button id="load-svg">Load SVG</button>
            <button id="ungroup-all">Ungroup All</button>
            <button id="save-svg">Save SVG</button>
            <button id="zoom-in">Zoom In</button>
            <button id="zoom-out">Zoom Out</button>
            <button id="reset-view">Reset View</button>
            <span id="status-message"></span>
          </div>
          <div class="editor-container">
            <div class="svg-workspace" id="svg-workspace"></div>
            <div class="properties-panel">
              <h3>Element Properties</h3>
              <div id="properties-content">
                <p>No element selected</p>
              </div>
            </div>
          </div>
        </div>
      `;

        // Get references to UI elements
        this.workspace = document.getElementById('svg-workspace');
        this.propertiesPanel = document.getElementById('properties-content');
        this.statusMessage = document.getElementById('status-message');

        // Create file input element
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.svg';
        this.fileInput.style.display = 'none';
        this.container.appendChild(this.fileInput);
    }

    // Set up event listeners
    setupEventListeners() {
        // Button click events
        document.getElementById('load-svg').addEventListener('click', () => this.fileInput.click());
        document.getElementById('ungroup-all').addEventListener('click', () => {
            this.elementManager.ungroupAll();
            this.showStatus('All groups have been ungrouped');
        });
        document.getElementById('save-svg').addEventListener('click', () => this.saveSVG());
        document.getElementById('zoom-in').addEventListener('click', () => this.zoom(0.1));
        document.getElementById('zoom-out').addEventListener('click', () => this.zoom(-0.1));
        document.getElementById('reset-view').addEventListener('click', () => this.resetView());

        // File input change event
        this.fileInput.addEventListener('change', async (event) => {
            if (event.target.files.length > 0) {
                await this.loadSVG(event.target.files[0]);
            }
        });

        // SVG workspace events for panning
        this.workspace.addEventListener('mousedown', (event) => {
            // Middle mouse button or space+left button for panning
            if (event.button === 1 || (event.button === 0 && event.getModifierState('Space'))) {
                this.startPanning(event);
            }
        });

        // Prevent context menu on right-click
        this.workspace.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            // Delete selected elements (Delete key)
            if (event.key === 'Delete' && this.elementManager.selectedElements.length > 0) {
                this.elementManager.selectedElements.forEach(el => el.remove());
                this.elementManager.deselectAll();
                this.updatePropertiesPanel();
            }

            // Undo (Ctrl/Cmd + Z)
            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                // Implement undo functionality
            }
        });
    }

    // Show a status message
    showStatus(message, duration = 3000) {
        this.statusMessage.textContent = message;
        this.statusMessage.style.display = 'inline';

        // Clear after duration
        setTimeout(() => {
            this.statusMessage.textContent = '';
            this.statusMessage.style.display = 'none';
        }, duration);
    }

    // Start panning the view
    startPanning(event) {
        event.preventDefault();
        this.isPanning = true;
        this.lastPanPoint = { x: event.clientX, y: event.clientY };

        // Add event listeners for panning
        document.addEventListener('mousemove', this.panMoveHandler);
        document.addEventListener('mouseup', this.panEndHandler);

        // Change cursor
        this.workspace.style.cursor = 'grabbing';
    }

    // Handle pan movement
    panMoveHandler = (event) => {
        if (!this.isPanning) return;

        const dx = event.clientX - this.lastPanPoint.x;
        const dy = event.clientY - this.lastPanPoint.y;

        this.panOffset.x += dx;
        this.panOffset.y += dy;

        this.lastPanPoint = { x: event.clientX, y: event.clientY };
        this.applyTransform();
    }

    // End panning
    panEndHandler = () => {
        this.isPanning = false;
        document.removeEventListener('mousemove', this.panMoveHandler);
        document.removeEventListener('mouseup', this.panEndHandler);

        // Reset cursor
        this.workspace.style.cursor = 'default';
    }

    // Load an SVG file
    async loadSVG(file) {
        try {
            const svgDoc = await this.loader.loadFromFile(file);

            // Clear the workspace
            this.workspace.innerHTML = '';

            // Extract the SVG element
            const svgElement = svgDoc.documentElement.cloneNode(true);
            this.svgContainer = svgElement;

            // Ensure the SVG fills the workspace
            svgElement.setAttribute('width', '100%');
            svgElement.setAttribute('height', '100%');

            // Add the SVG to the workspace
            this.workspace.appendChild(svgElement);

            // Add event listeners to all SVG elements
            this.addElementListeners(svgElement);

            // Reset view
            this.resetView();

            // Show success message
            this.showStatus(`SVG loaded successfully: ${file.name}`);
        } catch (error) {
            console.error('Error loading SVG:', error);
            this.showStatus('Failed to load SVG file. Please try again with a valid SVG file.', 5000);
        }
    }

    // Add event listeners to SVG elements
    addElementListeners(rootElement) {
        // First add click listener to the root SVG
        rootElement.addEventListener('click', (event) => {
            // If clicking the SVG itself (not a child), deselect all
            if (event.target === rootElement) {
                this.elementManager.deselectAll();
                this.updatePropertiesPanel();
            }
        });

        // Then add listeners to all elements
        const allElements = rootElement.querySelectorAll('*');
        allElements.forEach(el => {
            // Skip non-visible or container elements
            if (el.tagName === 'defs' || el.tagName === 'style' || el.classList.contains('resize-handle')) {
                return;
            }

            // Make draggable
            el.style.cursor = 'move';

            // Select on click
            el.addEventListener('click', (event) => {
                event.stopPropagation();
                this.elementManager.selectElement(el);
            });

            // Start dragging on mousedown
            el.addEventListener('mousedown', (event) => {
                if (event.button === 0) { // Left click only
                    event.stopPropagation();

                    // Select if not already selected
                    if (!this.elementManager.selectedElements.includes(el)) {
                        this.elementManager.selectElement(el);
                    }

                    // Start dragging
                    this.elementManager.startDragging(el, event);
                }
            });
        });
    }

    // Update the properties panel with selected element info
    updatePropertiesPanel() {
        const selected = this.elementManager.selectedElements;

        if (selected.length === 0) {
            this.propertiesPanel.innerHTML = '<p>No element selected</p>';
            return;
        }

        const el = selected[0]; // Use the first selected element

        // Get element type and attributes
        const elementType = el.tagName;
        const attributes = [...el.attributes].map(attr => {
            return { name: attr.name, value: attr.value };
        });

        // Create properties form
        let html = `
        <div class="property">
          <label>Element Type:</label>
          <span>${elementType}</span>
        </div>
      `;

        // Add editable properties based on element type
        attributes.forEach(attr => {
            // Skip certain attributes
            if (['class'].includes(attr.name)) return;

            html += `
          <div class="property">
            <label>${attr.name}:</label>
            <input type="text" data-attr="${attr.name}" value="${attr.value}" />
          </div>
        `;
        });

        // Add delete button
        html += `<button id="delete-element" class="delete-btn">Delete Element</button>`;

        this.propertiesPanel.innerHTML = html;

        // Add event listeners to property inputs
        const inputs = this.propertiesPanel.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('change', (event) => {
                const attrName = event.target.dataset.attr;
                const attrValue = event.target.value;
                this.elementManager.updateElementProperty(attrName, attrValue);
            });
        });

        // Add delete button listener
        document.getElementById('delete-element').addEventListener('click', () => {
            this.elementManager.selectedElements.forEach(el => el.remove());
            this.elementManager.deselectAll();
            this.updatePropertiesPanel();
        });
    }

    loadFromString(svgString) {
        if (!this.workspace) return; // Safety check

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
        
        this.workspace.innerHTML = '';
        const svgElement = svgDoc.documentElement.cloneNode(true);
        this.svgContainer = svgElement;
        
        svgElement.setAttribute('width', '100%');
        svgElement.setAttribute('height', '100%');
        
        this.workspace.appendChild(svgElement);
        this.addElementListeners(svgElement);
        this.resetView();
    }

    // Save the current SVG
    saveSVG() {
        if (!this.svgContainer) {
            this.showStatus('No SVG loaded to save', 3000);
            return;
        }

        // Create a clean copy of the SVG
        const svgCopy = this.svgContainer.cloneNode(true);

        // Remove any editor-specific attributes/classes
        svgCopy.querySelectorAll('.selected, .resize-handle, .resize-handles-group').forEach(el => {
            if (el.classList.contains('selected')) {
                el.classList.remove('selected');
            } else {
                el.remove();
            }
        });

        // Set explicit width and height
        const bbox = this.svgContainer.getBBox();
        svgCopy.setAttribute('width', bbox.width);
        svgCopy.setAttribute('height', bbox.height);
        svgCopy.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

        const svgData = new XMLSerializer().serializeToString(svgCopy);

        // Create a Blob with the SVG data
        const blob = new Blob([svgData], { type: 'image/svg+xml' });

        // Create a download link
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'floor-plan.svg';

        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Clean up
        URL.revokeObjectURL(url);

        this.showStatus('SVG saved successfully', 3000);
    }

    // Zoom in or out
    zoom(delta) {
        // Calculate new zoom level
        this.zoomLevel = Math.max(0.1, Math.min(5, this.zoomLevel + delta));

        // Apply the new transformation
        this.applyTransform();

        // Show zoom level
        this.showStatus(`Zoom level: ${Math.round(this.zoomLevel * 100)}%`);
    }

    // Reset view to original zoom and position
    resetView() {
        this.zoomLevel = 1;
        this.panOffset = { x: 0, y: 0 };
        this.applyTransform();
        this.showStatus('View reset');
    }

    // Apply zoom and pan transformations
    applyTransform() {
        if (!this.svgContainer) return;

        const transformValue = `translate(${this.panOffset.x}px, ${this.panOffset.y}px) scale(${this.zoomLevel})`;
        this.svgContainer.style.transform = transformValue;
        this.svgContainer.style.transformOrigin = 'center center';
    }

    // Render the editor (refresh display)
    render() {
        if (!this.svgContainer) return;

        // Re-add element listeners after modifications
        this.addElementListeners(this.svgContainer);

        // Apply current transformations
        this.applyTransform();
    }

    // Create a new shape element
    createShape(type, attributes = {}) {
        if (!this.svgContainer) {
            this.showStatus('No SVG loaded', 3000);
            return;
        }

        // Create a new SVG element based on type
        const element = document.createElementNS('http://www.w3.org/2000/svg', type);

        // Set default attributes based on element type
        switch (type) {
            case 'rect':
                element.setAttribute('x', 100);
                element.setAttribute('y', 100);
                element.setAttribute('width', 100);
                element.setAttribute('height', 80);
                element.setAttribute('fill', '#f0f0f0');
                element.setAttribute('stroke', '#000000');
                element.setAttribute('stroke-width', 2);
                break;

            case 'circle':
                element.setAttribute('cx', 150);
                element.setAttribute('cy', 150);
                element.setAttribute('r', 50);
                element.setAttribute('fill', '#f0f0f0');
                element.setAttribute('stroke', '#000000');
                element.setAttribute('stroke-width', 2);
                break;

            case 'ellipse':
                element.setAttribute('cx', 150);
                element.setAttribute('cy', 150);
                element.setAttribute('rx', 60);
                element.setAttribute('ry', 40);
                element.setAttribute('fill', '#f0f0f0');
                element.setAttribute('stroke', '#000000');
                element.setAttribute('stroke-width', 2);
                break;

            case 'line':
                element.setAttribute('x1', 100);
                element.setAttribute('y1', 100);
                element.setAttribute('x2', 200);
                element.setAttribute('y2', 200);
                element.setAttribute('stroke', '#000000');
                element.setAttribute('stroke-width', 2);
                break;

            case 'text':
                element.setAttribute('x', 100);
                element.setAttribute('y', 150);
                element.setAttribute('font-family', 'Arial');
                element.setAttribute('font-size', '14');
                element.textContent = 'Text Label';
                break;
        }

        // Apply any custom attributes
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }

        // Add the element to the SVG
        this.svgContainer.appendChild(element);

        // Add event listeners
        this.addElementListeners(element);

        // Select the new element
        this.elementManager.selectElement(element);

        return element;
    }

    // Import SVG from URL
    async importFromURL(url) {
        try {
            const svgDoc = await this.loader.loadFromURL(url);

            // Clear the workspace
            this.workspace.innerHTML = '';

            // Extract the SVG element
            const svgElement = svgDoc.documentElement.cloneNode(true);
            this.svgContainer = svgElement;

            // Ensure the SVG fills the workspace
            svgElement.setAttribute('width', '100%');
            svgElement.setAttribute('height', '100%');

            // Add the SVG to the workspace
            this.workspace.appendChild(svgElement);

            // Add event listeners to all SVG elements
            this.addElementListeners(svgElement);

            // Reset view
            this.resetView();

            // Show success message
            this.showStatus(`SVG loaded successfully from URL`);

            return true;
        } catch (error) {
            console.error('Error loading SVG from URL:', error);
            this.showStatus('Failed to load SVG from URL.', 5000);
            return false;
        }
    }

    // Group selected elements
    groupSelectedElements() {
        const selected = this.elementManager.selectedElements;

        if (selected.length < 2) {
            this.showStatus('Select at least two elements to group', 3000);
            return;
        }

        // Create a group element
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        // Add selected elements to the group
        selected.forEach(el => {
            // Clone the element to avoid reference issues
            const clone = el.cloneNode(true);

            // Add to group
            group.appendChild(clone);

            // Remove original element
            el.remove();
        });

        // Add the group to the SVG
        this.svgContainer.appendChild(group);

        // Add event listeners to the group
        this.addElementListeners(group);

        // Select the new group
        this.elementManager.deselectAll();
        this.elementManager.selectElement(group);

        this.showStatus('Elements grouped successfully');

        // Refresh the editor
        this.render();
    }

    // Ungroup selected elements
    ungroupSelectedElements() {
        const selected = this.elementManager.selectedElements;

        if (selected.length === 0) {
            this.showStatus('No elements selected', 3000);
            return;
        }

        let ungroupCount = 0;

        selected.forEach(el => {
            if (el.tagName === 'g') {
                this.elementManager.ungroupElement(el);
                ungroupCount++;
            }
        });

        if (ungroupCount > 0) {
            this.showStatus(`Ungrouped ${ungroupCount} group(s)`);

            // Refresh the editor
            this.render();
        } else {
            this.showStatus('No groups selected to ungroup', 3000);
        }
    }

    // Create grid lines for the SVG
    createGrid(size = 20, color = '#cccccc') {
        if (!this.svgContainer) return;

        // Remove any existing grid
        const existingGrid = this.svgContainer.querySelector('.grid-container');
        if (existingGrid) {
            existingGrid.remove();
        }

        // Get SVG dimensions
        const bbox = this.svgContainer.getBBox();
        const width = Math.max(1000, bbox.width + 200);
        const height = Math.max(1000, bbox.height + 200);

        // Create grid container
        const gridContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridContainer.classList.add('grid-container');

        // Create horizontal lines
        for (let y = 0; y <= height; y += size) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', -width / 2);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width * 1.5);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', 0.5);
            gridContainer.appendChild(line);
        }

        // Create vertical lines
        for (let x = 0; x <= width; x += size) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', -height / 2);
            line.setAttribute('x2', x);
            line.setAttribute('y2', height * 1.5);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', 0.5);
            gridContainer.appendChild(line);
        }

        // Insert grid at the beginning of SVG (as background)
        this.svgContainer.insertBefore(gridContainer, this.svgContainer.firstChild);
    }

    // Toggle grid visibility
    toggleGrid() {
        const existingGrid = this.svgContainer.querySelector('.grid-container');

        if (existingGrid) {
            existingGrid.remove();
            this.showStatus('Grid hidden');
        } else {
            this.createGrid();
            this.showStatus('Grid shown');
        }
    }

    // Add a new room with standard attributes
    addRoom(x = 100, y = 100, width = 200, height = 150) {
        // Create a room (rectangle)
        const room = this.createShape('rect', {
            x: x,
            y: y,
            width: width,
            height: height,
            fill: '#ffffff',
            stroke: '#000000',
            'stroke-width': 2,
            'data-type': 'room'
        });

        // Add a text label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + width / 2);
        text.setAttribute('y', y + height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-family', 'Arial');
        text.setAttribute('font-size', '14');
        text.textContent = 'Room';

        this.svgContainer.appendChild(text);

        // Add listeners to text
        this.addElementListeners(text);

        // Group room and text
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.appendChild(room.cloneNode(true));
        group.appendChild(text.cloneNode(true));

        // Remove individual elements
        room.remove();
        text.remove();

        // Add group to SVG
        this.svgContainer.appendChild(group);

        // Add event listeners
        this.addElementListeners(group);

        // Select the new group
        this.elementManager.selectElement(group);

        return group;
    }

    // Add a door element
    addDoor(x = 150, y = 100, width = 80, orientation = 'horizontal') {
        // Create a door group
        const doorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        doorGroup.setAttribute('data-type', 'door');

        // Create door line
        const doorLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');

        if (orientation === 'horizontal') {
            doorLine.setAttribute('x1', x);
            doorLine.setAttribute('y1', y);
            doorLine.setAttribute('x2', x + width);
            doorLine.setAttribute('y2', y);
        } else {
            doorLine.setAttribute('x1', x);
            doorLine.setAttribute('y1', y);
            doorLine.setAttribute('x2', x);
            doorLine.setAttribute('y2', y + width);
        }

        doorLine.setAttribute('stroke', '#000000');
        doorLine.setAttribute('stroke-width', 2);
        doorGroup.appendChild(doorLine);

        // Create door arc
        const doorArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        if (orientation === 'horizontal') {
            // Arc from left to right, opening inwards
            doorArc.setAttribute('d', `M ${x},${y} A ${width},${width} 0 0,1 ${x + width},${y + width}`);
        } else {
            // Arc from top to bottom, opening inwards
            doorArc.setAttribute('d', `M ${x},${y} A ${width},${width} 0 0,0 ${x + width},${y + width}`);
        }

        doorArc.setAttribute('fill', 'none');
        doorArc.setAttribute('stroke', '#000000');
        doorArc.setAttribute('stroke-width', 1);
        doorArc.setAttribute('stroke-dasharray', '3,3');
        doorGroup.appendChild(doorArc);

        // Add to SVG
        this.svgContainer.appendChild(doorGroup);

        // Add event listeners
        this.addElementListeners(doorGroup);

        // Select the new door
        this.elementManager.selectElement(doorGroup);

        return doorGroup;
    }

    // Add a window element
    addWindow(x = 150, y = 100, width = 80, orientation = 'horizontal') {
        // Create a window group
        const windowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        windowGroup.setAttribute('data-type', 'window');

        // Create outer line
        const outerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');

        if (orientation === 'horizontal') {
            outerLine.setAttribute('x1', x);
            outerLine.setAttribute('y1', y);
            outerLine.setAttribute('x2', x + width);
            outerLine.setAttribute('y2', y);
        } else {
            outerLine.setAttribute('x1', x);
            outerLine.setAttribute('y1', y);
            outerLine.setAttribute('x2', x);
            outerLine.setAttribute('y2', y + width);
        }

        outerLine.setAttribute('stroke', '#000000');
        outerLine.setAttribute('stroke-width', 2);
        windowGroup.appendChild(outerLine);

        // Create inner line (parallel at a small offset)
        const innerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const offset = 5;

        if (orientation === 'horizontal') {
            innerLine.setAttribute('x1', x);
            innerLine.setAttribute('y1', y + offset);
            innerLine.setAttribute('x2', x + width);
            innerLine.setAttribute('y2', y + offset);
        } else {
            innerLine.setAttribute('x1', x + offset);
            innerLine.setAttribute('y1', y);
            innerLine.setAttribute('x2', x + offset);
            innerLine.setAttribute('y2', y + width);
        }

        innerLine.setAttribute('stroke', '#000000');
        innerLine.setAttribute('stroke-width', 2);
        windowGroup.appendChild(innerLine);

        // Add to SVG
        this.svgContainer.appendChild(windowGroup);

        // Add event listeners
        this.addElementListeners(windowGroup);

        // Select the new window
        this.elementManager.selectElement(windowGroup);

        return windowGroup;
    }
}

// ----- Initialize the SVG Floor Plan Editor -----
document.addEventListener('DOMContentLoaded', () => {
    // Create styles for the editor
    const styleElement = document.createElement('style');
    styleElement.textContent = `
    .svg-editor-layout {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      font-family: Arial, sans-serif;
    }
    
    .toolbar {
      padding: 10px;
      background-color: #f0f0f0;
      border-bottom: 1px solid #ddd;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    
    .editor-container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    .svg-workspace {
      flex: 1;
      overflow: auto;
      background-color: #e6e6e6;
      position: relative;
    }
    
    .properties-panel {
      width: 250px;
      padding: 10px;
      background-color: #f9f9f9;
      border-left: 1px solid #ddd;
      overflow: auto;
    }
    
    .property {
      margin-bottom: 8px;
    }
    
    .property label {
      display: block;
      margin-bottom: 4px;
      font-weight: bold;
    }
    
    .property input {
      width: 100%;
      padding: 4px;
      border: 1px solid #ddd;
    }
    
    .selected {
      outline: 2px dashed #0066ff;
    }
    
    .resize-handle {
      cursor: nwse-resize;
    }
    
    .delete-btn {
      margin-top: 10px;
      padding: 5px 10px;
      background-color: #ff3333;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
    
    .delete-btn:hover {
      background-color: #ff0000;
    }
    
    #status-message {
      margin-left: auto;
      font-size: 14px;
      color: #333;
      display: none;
    }
    
    button {
      padding: 5px 10px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
    
    button:hover {
      background-color: #45a049;
    }
  `;
    document.head.appendChild(styleElement);

    // Initialize the editor
    const editor = new SVGEditor('svg-editor-container');

    // Add to window for debugging
    window.editor = editor;

    // Add extra toolbar buttons for shapes
    const toolbar = document.querySelector('.toolbar');

    // Add separator
    const separator = document.createElement('span');
    separator.style.borderLeft = '1px solid #aaa';
    separator.style.height = '20px';
    separator.style.margin = '0 10px';
    toolbar.appendChild(separator);

    // Add shape buttons
    const shapes = [
        { name: 'Rectangle', type: 'rect' },
        { name: 'Circle', type: 'circle' },
        { name: 'Line', type: 'line' },
        { name: 'Text', type: 'text' },
        { name: 'Room', type: 'room' },
        { name: 'Door', type: 'door' },
        { name: 'Window', type: 'window' }
    ];

    shapes.forEach(shape => {
        const button = document.createElement('button');
        button.textContent = `Add ${shape.name}`;
        button.id = `add-${shape.type}`;
        toolbar.appendChild(button);

        button.addEventListener('click', () => {
            switch (shape.type) {
                case 'room':
                    editor.addRoom();
                    break;
                case 'door':
                    editor.addDoor();
                    break;
                case 'window':
                    editor.addWindow();
                    break;
                default:
                    editor.createShape(shape.type);
                    break;
            }
        });
    });

    // Add grid toggle button
    const gridButton = document.createElement('button');
    gridButton.textContent = 'Toggle Grid';
    gridButton.id = 'toggle-grid';
    toolbar.appendChild(gridButton);

    gridButton.addEventListener('click', () => {
        editor.toggleGrid();
    });

    // Add group/ungroup buttons
    const groupButton = document.createElement('button');
    groupButton.textContent = 'Group';
    groupButton.id = 'group-elements';
    toolbar.appendChild(groupButton);

    groupButton.addEventListener('click', () => {
        editor.groupSelectedElements();
    });

    const ungroupButton = document.createElement('button');
    ungroupButton.textContent = 'Ungroup';
    ungroupButton.id = 'ungroup-selected';
    toolbar.appendChild(ungroupButton);

    ungroupButton.addEventListener('click', () => {
        editor.ungroupSelectedElements();
    });
});