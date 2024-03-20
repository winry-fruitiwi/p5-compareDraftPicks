class ColorSelector {
    constructor(displayColor) {
        // define color, used when rendered
        this.displayColor = displayColor

        this.selected = false
    }

    toggleSelection() {}

    currentValue() {}

    // requires display arguments because it won't have a set position all
    // the time
    render(x, y) {}
}
