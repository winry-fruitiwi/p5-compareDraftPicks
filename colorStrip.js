class ColorStrip {
    constructor() {
        // initialize list of colors, pulled from mtgCombatTricks
        let colors = {
            "W": [62, 20, 94],
            "U": [208, 20, 89],
            "B": [26, 10, 67],
            "R": [17, 54, 85],
            "G": [100, 27, 70]
        }

        // initialize the list of color selectors and populate it with
        // ColorSelectors
        this.selectors = {}
        let colorKeys = Object.keys(colors)
        let colorValues = Object.values(colors)

        for (let i = 0; i < colorKeys.length; i++) {
            let key = colorKeys[i]
            let value = colorValues[i]

            this.selectors[key] = new ColorSelector(value)
        }
    }

    toggleColorSelection() {}

    currentValues() {}

    render(x, y) {}
}
