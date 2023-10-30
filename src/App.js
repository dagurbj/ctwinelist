import React, { useEffect, useState } from 'react';
import ReactXmlParser from 'react-xml-parser';
import './App.css';
import he from 'he';
// import SyncLoader from "react-spinners/SyncLoader.js";

const parseXML = (xmlString) => {
  const xml = new ReactXmlParser().parseFromString(xmlString);

  const rows = xml.getElementsByTagName('row');

  return rows.map((row) => {
    const wine = {
      iWine: row.getElementsByTagName('iWine')[0].value,
      WineBarcode: row.getElementsByTagName('WineBarcode')[0].value,
      Quantity: row.getElementsByTagName('Quantity')[0].value,
      Pending: row.getElementsByTagName('Pending')[0].value,
      Size: row.getElementsByTagName('Size')[0].value,
      Price: row.getElementsByTagName('Price')[0].value,
      Valuation: row.getElementsByTagName('Valuation')[0].value,
      MyValue: row.getElementsByTagName('MyValue')[0].value,
      WBValue: row.getElementsByTagName('WBValue')[0].value,
      CTValue: row.getElementsByTagName('CTValue')[0].value,
      MenuPrice: row.getElementsByTagName('MenuPrice')[0].value,
      Currency: row.getElementsByTagName('Currency')[0].value,
      Vintage: row.getElementsByTagName('Vintage')[0].value,
      Wine: he.decode(row.getElementsByTagName('Wine')[0].value),
      Locale: row.getElementsByTagName('Locale')[0].value,
      Country: row.getElementsByTagName('Country')[0].value,
      Region: row.getElementsByTagName('Region')[0].value,
      SubRegion: row.getElementsByTagName('SubRegion')[0].value,
      Appellation: he.decode(row.getElementsByTagName('Appellation')[0].value),
      Producer: he.decode(row.getElementsByTagName('Producer')[0].value),
      SortProducer: row.getElementsByTagName('SortProducer')[0].value,
      Type: row.getElementsByTagName('Type')[0].value,
      Color: row.getElementsByTagName('Color')[0].value,
      Category: row.getElementsByTagName('Category')[0].value,
      Varietal: row.getElementsByTagName('Varietal')[0].value,
      MasterVarietal: row.getElementsByTagName('MasterVarietal')[0].value,
      Designation: row.getElementsByTagName('Designation')[0].value,
      Vineyard: row.getElementsByTagName('Vineyard')[0].value,
    };

    wine.FormattedWine = TrimFromWineStr(wine.Wine, wine.Producer);
    wine.FormattedWine = TrimFromWineStr(wine.FormattedWine, wine.Appellation);
    wine.FormattedVintage = (wine.Vintage === "1001" ? "NV" : wine.Vintage);
    return wine;
  });
};

function TrimFromWineStr(wineStr, toTrim){
  if (toTrim < wineStr && wineStr.includes(toTrim)) {
    return wineStr.substring(toTrim.length).trim();
  }
  return wineStr;
}

const groupWinesByTypeCountryRegion = (wines) => {
  const groupedWines = {};

  wines.forEach((wine) => {
    const { Type, Country, Region, Appellation } = wine;

    if (!groupedWines[Type]) {
      groupedWines[Type] = {};
    }

    if (!groupedWines[Type][Country]) {
      groupedWines[Type][Country] = {};
    }

    if (!groupedWines[Type][Country][Region]) {
      groupedWines[Type][Country][Region] = {};
    }

    if (!groupedWines[Type][Country][Region][Appellation]) {
      groupedWines[Type][Country][Region][Appellation] = [];
    }

    groupedWines[Type][Country][Region][Appellation].push(wine);
  });

  return groupedWines;
};

const App = () => {
  const [wines, setWines] = useState([]);
  const [currentDate, setCurrentDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const handle = localStorage.getItem('CTHandle');
    const password = localStorage.getItem('CTPassword');

    if (!handle || !password) {
      const newHandle = prompt('Please enter your CellarTracker handle:');
      const newPassword = prompt('Please enter your CellarTracker password:');

      localStorage.setItem('CTHandle', newHandle);
      localStorage.setItem('CTPassword', newPassword);
    }

    const API_URL = `https://cellartracker-proxyservice-jp9vrqw3b-dagurbj.vercel.app/api/proxy?username=${handle}&password=${password}`;
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        const xmlString = await response.text();
        const jsonData = parseXML(xmlString);
        setWines(jsonData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();

    const getCurrentDate = () => {
      const date = new Date();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2); // Extract the last two digits of the year

      return `${month} '${year}`;
    };

    setCurrentDate(getCurrentDate());
  }, []);

  const groupedWines = groupWinesByTypeCountryRegion(wines);

  const sparklingTypes = Object.keys(groupedWines).filter((type) =>
    type.toLowerCase().includes('sparkling')
  );

  // Sort the sparkling types alphabetically
  sparklingTypes.sort();

  const notSparklingOrSweet = ['White', 'Red', 'Orange'];

  const preferred = [...sparklingTypes, ...notSparklingOrSweet];

  // Get the remaining types not included in the sparkling types
  const remainingTypes = Object.keys(groupedWines).filter(
    (type) => !preferred.includes(type)
  );

  // Sort the remaining types alphabetically
  remainingTypes.sort();

  // Concatenate the sparkling types with the remaining types
  const sortedTypes = [...preferred, ...remainingTypes];
  
  const handleClearLocalStorage = () => {
    localStorage.removeItem('CTHandle');
    localStorage.removeItem('CTPassword');
    console.log('Local storage cleared');
  };

  if (loading) {
    return <div className="spinner">Loading...</div>;
  }

  return (
    <div>
      <div>
        <h1>Wines {currentDate}</h1>
        {sortedTypes.map((type) => {
          const countries = groupedWines[type];
          if (countries) {
            return (
              <div key={type}>
                <h2>{type}</h2>
                {Object.entries(countries).map(([country, regions]) => (
                  <div key={country}>
                    <h3>{country}</h3>
                    {Object.entries(regions).map(([region, appellations]) => (
                      <div key={region}>
                        <h4>{region}</h4>
                        {Object.entries(appellations).map(([appellation, wines]) => (
                          <div key={appellation}>
                            <h5 hidden={appellation === 'Unknown'}>{appellation}</h5>
                            <ul>
                              {wines
                                .sort((a, b) => b.Vintage - a.Vintage)
                                .map((wine) => (
                                  <li key={wine.iWine}>
                                    <a href={`https://www.cellartracker.com/wine.asp?iWine=${wine.iWine}`} target='new'>
                                      <span className="producer">{wine.Producer}</span> <i>{wine.FormattedWine}</i>
                                      , {wine.FormattedVintage}
                                    </a>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          }
          return null;
        })}
      </div>
      <div>
        <button onClick={handleClearLocalStorage}>Clear Local Storage</button>
      </div>
    </div>
  );
};

export default App;
