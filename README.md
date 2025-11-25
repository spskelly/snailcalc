# 🐌 Snail Game Calculators

A comprehensive suite of calculators for optimizing your Snail game strategy. This web application provides tools for gear planning, rocket cabin upgrades, stele level analysis, and cooking profitability.

![Project Preview](Eye_of_Horus.png)

## ✨ Features

### 🎮 Gear Calculator
- **Snail Gear Planning**: Configure 24 gear slots (12 equipped + 12 unequipped)
- **Minion Gear Planning**: Configure 12 minion slots (6 equipped + 6 unequipped)
- **Preset System**: Save and load up to 3 configurations for quick comparisons
- **Real-time Cost Calculation**: Automatic calculation of all required materials
- **Cumulative Costs**: Tracks total costs including gear upgrades and amulets
- **Material Tracking**: Monitors Eye of Horus, Orange, Abyss Wing, Heaven Wing, Glue, B-tad, and Crystals
- **Local Storage**: Your configurations are automatically saved to your browser

### 🚀 Rocket Cabin Calculator
- **Three Cabin Types**: Separate calculators for Energy, Attack, and Defense cabins
- **Tier System**: Upgrade planning from T1 (White) through T5 (Orange)
- **Flexible Display**: Convert material costs between any tier (T1-T5) for easier planning
- **Excess Materials**: Track leftover materials from each tier to optimize upgrades
- **Material Conversion**: Automatic T1 equivalent calculations (5:1 ratio per tier)
- **Preset System**: Save and compare up to 3 cabin configurations per type

### 📊 Stele Calculator
- **Probability Analysis**: 10,000 Monte Carlo simulations for accurate predictions
- **Multiple Targets**: Calculate for Stele levels 5, 8, 10, 12, and 15
- **Statistical Dashboard**: View minimum, mean, maximum, and standard deviation
- **Distribution Chart**: Visual histogram showing token distribution probabilities
- **Luck Checker**: Input your token count to see probability of reaching target
- **Energy Tracking**: Shows total energy required for each Stele level

### 🍳 Cooking Calculator
- **Recipe Management**: Enable/disable recipes and configure star ratings
- **Vendor Configuration**: Set which vendors are unlocked (affects ingredient costs)
- **Shop Purchase Planning**: Track daily shop purchases and costs
- **Profitability Analysis**: Calculates profit per dish and daily ROI
- **Multi-Recipe Optimization**: Compare multiple recipes simultaneously
- **Preset System**: Save and load cooking strategies for different scenarios

## 🚀 Quick Start

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (required for ES6 module imports)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/snailcalc.git
   cd snailcalc
   ```

2. **Start a local server**

   Choose one of the following methods:

   **Option A: Python (Recommended)**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option B: Node.js (http-server)**
   ```bash
   # Install globally
   npm install -g http-server
   
   # Run server
   http-server -p 8000
   ```

   **Option C: Node.js (Live Server)**
   ```bash
   # Install globally
   npm install -g live-server
   
   # Run server
   live-server --port=8000
   ```

   **Option D: VS Code Extension**
   - Install the "Live Server" extension in VS Code
   - Right-click on `index.html`
   - Select "Open with Live Server"

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## 📁 Project Structure

```
snailcalc/
├── index.html              # Main HTML file with all calculator sections
├── styles.css              # All styling and responsive design
├── script.js               # Main logic for gear and rocket calculators
├── data.js                 # Gear and rocket data (costs, recipes, paths)
├── cooking.js              # Cooking calculator logic and UI
├── cooking-data.js         # Cooking recipes, ingredients, and vendor data
├── stele.js                # Stele probability calculator (ES6 module)
├── Eye_of_Horus.png       # Favicon
├── CNAME                   # GitHub Pages domain configuration
└── .gitignore             # Git ignore rules
```

## 🛠️ Technical Details

### Technologies Used
- **Pure HTML5/CSS3/JavaScript** - No frameworks required
- **ES6 Modules** - For stele calculator (requires local server)
- **Chart.js** - For stele distribution visualization (loaded from CDN)
- **Local Storage API** - For persistent configuration saving
- **Canvas API** - For chart rendering

### Browser Compatibility
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

### Why Do I Need a Local Server?

The project uses ES6 module imports (`import/export`) for the stele calculator. Modern browsers block ES6 module imports from `file://` URLs for security reasons (CORS policy). A local server serves the files via `http://`, which allows modules to load properly.

**Without a server**, you'll see errors like:
```
Access to script at 'file:///...' from origin 'null' has been blocked by CORS policy
```

## 📖 Usage Guide

### Gear Calculator

1. **Select gear levels** from the dropdown menus for each slot
2. **View costs** in the summary table (Current vs Presets)
3. **Save presets** to compare different gear configurations
4. **Toggle sections** to hide/show unequipped gear slots
5. **Reset** to clear all selections

### Rocket Cabin Calculator

1. **Select target tier** for each device (T1-T5)
2. **Add excess materials** (optional) if you have leftover tier materials
3. **Change display tier** to convert costs to any tier
4. **Save presets** to compare upgrade paths
5. **Review summary** showing total materials needed

### Stele Calculator

1. **Click a Stele level button** (5, 8, 10, 12, or 15)
2. **View simulation results** showing token distribution
3. **Check the chart** for visual probability distribution
4. **Use luck checker** to see your odds with X tokens
5. **Review statistics** (min, mean, max, standard deviation)

### Cooking Calculator

1. **Configure vendors** - Enable vendors you've unlocked
2. **Set shop purchases** - Select which items you buy daily
3. **Enable recipes** - Check recipes you can cook
4. **Set star levels** - Configure your recipe star ratings
5. **Review results** - See most profitable dishes and daily ROI

## 💾 Data Persistence

All calculators use browser Local Storage to save your settings:
- Gear configurations
- Rocket cabin setups
- Cooking presets
- Display preferences

**Note**: Clearing browser data will reset all saved configurations.

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- **Live Demo**: [https://snailcalc.com](https://snailcalc.com) (if hosted)
- **Issues**: Report bugs or request features
- **Analytics**: Powered by GoatCounter (privacy-friendly)

## ⚙️ Customization

### Adding New Recipes
Edit `cooking-data.js` to add new recipes:
```javascript
RECIPES.push({
  name: "New Dish",
  category: "Main",
  basePrice: 100,
  ingredients: { /* ... */ },
  maxStars: 5
});
```

### Modifying Gear Costs
Edit `data.js` to update gear upgrade costs:
```javascript
const SNAIL_GEAR_INCREMENTAL = {
  "Red": { eoh: 50, glue: 100, b_tad: 200 },
  // ...
};
```

### Adjusting Stele Probabilities
Edit `stele.js` to modify token probabilities:
```javascript
const PROBABILITIES = [
  { energy: 0, probability: 0.537 },
  // ...
];
```

## 🐛 Troubleshooting

### Issue: "Failed to load module script"
**Solution**: Make sure you're running a local server (see Quick Start)

### Issue: Changes not appearing
**Solution**: Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)

### Issue: Presets not saving
**Solution**: Check if browser Local Storage is enabled

### Issue: Charts not displaying
**Solution**: Ensure Chart.js CDN is accessible (check internet connection)

## 📊 Analytics

This project uses GoatCounter for privacy-friendly analytics. No personal data is collected.

**Built with ❤️ for the Snail game community**
