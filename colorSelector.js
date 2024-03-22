class ColorSelector {
    constructor(displayColor, color) {
        // define background color, used when rendered
        this.displayColor = displayColor

        // define text displayed
        this.colorText = color

        this.selected = false
    }

    toggleSelection() {}

    currentValue() {}

    // requires display arguments because it won't have a set position all
    // the time
    render(x, y) {

        noStroke()
        fill(0, 0, 15)
        circle(
            x,
            y,
            cellHeight
        )

        fill(0, 0, 40)
        textAlign(CENTER, CENTER)
        text(this.colorText,
            x,
            y
        )
    }
}
