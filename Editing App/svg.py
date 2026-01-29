    import cv2
    import numpy as np
    import svgwrite

    # Load the image
    image_path = "floor-plan.png"  # Replace with your actual image file
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

    # Apply edge detection
    edges = cv2.Canny(image, threshold1=100, threshold2=200)

    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Create an SVG file
    svg_path = "floor_plan3.svg"
    dwg = svgwrite.Drawing(svg_path, profile='tiny')

    # Convert contours to SVG paths
    for contour in contours:
        points = [(float(point[0][0]), float(point[0][1])) for point in contour]
        if len(points) > 1:
            dwg.add(dwg.polyline(points, stroke='black', fill='none', stroke_width=0.5))

    # Save the SVG file
    dwg.save()

    print(f"SVG file saved as {svg_path}")
