class ColorStrip {
    constructor() {
        // initialize list of colors, pulled from mtgCombatTricks
        let colors = {
            "W": color(62, 20, 94),
            "U": color(208, 30, 89),
            "B": color(26, 10, 67),
            "R": color(17, 64, 85),
            "G": color(100, 37, 70)
        }

        // initialize the list of color selectors and populate it with
        // ColorSelectors
        this.selectors = {}
        let colorKeys = Object.keys(colors)
        let colorValues = Object.values(colors)

        for (let i = 0; i < colorKeys.length; i++) {
            let key = colorKeys[i]
            let value = colorValues[i]

            this.selectors[key] = new ColorSelector(value, key)
        }
    }

    toggleColorSelection() {}

    currentValues() {}

    render(x, y) {
        // colors to display
        let colors = Object.keys(this.selectors)
        let colorCircleMargin = 10

        for (let i=0; i < colors.length; i++) {
            let selector = Object.values(this.selectors)[i]

            selector.render(x + i * (colorCircleMargin + cellHeight), y)
        }
    }
}
