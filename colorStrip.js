class ColorStrip {
    constructor() {
        // initialize list of colors, pulled from mtgCombatTricks
        let colors = {
            "W": color(62, 20, 94),
            "U": color(208, 40, 89),
            "B": color(26, 10, 67),
            "R": color(17, 74, 85),
            "G": color(100, 47, 70)
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

    toggleColorSelection() {
        // I don't think this is required
    }

    // returns currently selected colors' ID (aka if this.selectors' W and U
    // selectors were on, the list would return ["W", "U"]
    currentlySelected() {
        let currentColors = ""
        let colorKeys = Object.keys(this.selectors)
        let colorValues = Object.values(this.selectors)

        for (let i=0; i < colorKeys.length; i++) {
            let selectorID = colorKeys[i]
            let selector = colorValues[i]

            if (selector.currentValue()) {
                currentColors += selectorID
            }
        }

        // note that this is always sorted in WUBRG order because that's how
        // it's iterated over
        return currentColors
    }

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
