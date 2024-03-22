class ColorSelector {
    constructor(displayColor, color) {
        // define background color, used when rendered
        this.displayColor = displayColor

        // define text displayed
        this.colorText = color

        this.selected = false
    }

    toggleSelection() {
        this.selected = !this.selected
    }

    currentValue() {
        return this.selected
    }

    // requires display arguments because it won't have a set position all
    // the time
    render(x, y) {
        // draw the background circle with the correct background color
        noStroke()
        fill(0, 0, 15)

        // since this is a circle, hover check is just the distance between
        // mouse and the center of the circle
        let circleMouseDist = dist(mouseX, mouseY, x, y)

        if (circleMouseDist <= cellHeight/2 && mouseJustReleased) {
            this.toggleSelection()
        }

        if (this.selected)
            fill(this.displayColor)

        circle(
            x,
            y,
            cellHeight
        )

        // text color changes based on on/off. draw the text to denote the color
        fill(0, 0, 40)
        if (this.selected)
            fill(0, 0, 9)
        textAlign(CENTER, CENTER)
        text(this.colorText,
            x,
            y
        )
    }
}
