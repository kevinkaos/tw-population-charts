/* eslint-disable import/no-extraneous-dependencies */
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import './App.scss';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import SettingsIcon from './img/settings-icon.svg';

function App() {
  const [yearsEnum, setYearsEnum] = useState([]);
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(null);
  const [countiesAndTowns, setCountiesAndTowns] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedTown, setSelectedTown] = useState('');
  const [hhOrdinaryMale, setHhOrdinaryMale] = useState(null);
  const [hhOrdinaryFemale, setHhOrdinaryFemale] = useState(null);
  const [hhSingleMale, setHhSingleMale] = useState(null);
  const [hhSingleFemale, setHhSingleFemale] = useState(null);

  const showCharts = useMemo(() => hhOrdinaryMale !== null
  && hhOrdinaryFemale !== null
  && hhSingleMale !== null
  && hhSingleFemale !== null, [hhOrdinaryFemale, hhOrdinaryMale, hhSingleFemale, hhSingleMale]);

  function getCountyTownStrings(countyTownStringData) {
    const result = [];
    countyTownStringData?.forEach((item) => {
      result.push(item.site_id);
    });
    return result;
  }

  function extractCountyTown(countyTownString, countyUnit = ['縣', '市']) {
    const towns = {};
    let currentCounty = null;
    const result = [];
    for (let i = 0; i < countyTownString.length; i += 1) {
      const str = countyTownString[i];
      for (let j = 0; j < countyUnit.length; j += 1) {
        const unit = countyUnit[j];
        const index = str.indexOf(unit);
        if (index !== -1) {
          const county = str.slice(0, index + 1);
          const town = str.slice(index + 1);
          if (county !== currentCounty) {
            currentCounty = county;
            result.push({ county, towns: [] });
          }
          if (!towns[town]) {
            towns[town] = true;
            result[result.length - 1].towns.push(town);
          }
          break;
        }
      }
    }
    return result;
  }

  function handleYearChange(e) {
    setSelectedYear(e.target.value);
    setSelectedCounty('');
    setSelectedTown('');
    setHhOrdinaryMale(null);
    setHhOrdinaryFemale(null);
    setHhSingleMale(null);
    setHhSingleFemale(null);
  }

  function handleCountyChange(e) {
    setSelectedCounty(e.target.value);
    setSelectedTown('');
    setHhOrdinaryMale(null);
    setHhOrdinaryFemale(null);
    setHhSingleMale(null);
    setHhSingleFemale(null);
  }

  function handleTownChange(e) {
    setSelectedTown(e.target.value);
    setHhOrdinaryMale(null);
    setHhOrdinaryFemale(null);
    setHhSingleMale(null);
    setHhSingleFemale(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await axios.get(`https://www.ris.gov.tw/rs-opendata/api/v1/datastore/ODRP019/${selectedYear}?COUNTY=${selectedCounty}&TOWN=${selectedTown}`);
    const hhData = res.data.responseData;
    let hhOrdinaryMaleSum = 0;
    let hhSingleMaleSum = 0;
    let hhOrdinaryFemaleSum = 0;
    let hhSingleFemaleSum = 0;
    hhData.forEach((householdData) => {
      hhOrdinaryMaleSum += Number(householdData.household_ordinary_m);
      hhSingleMaleSum += Number(householdData.household_single_m);
      hhOrdinaryFemaleSum += Number(householdData.household_ordinary_f);
      hhSingleFemaleSum += Number(householdData.household_single_f);
    });
    setHhOrdinaryMale(Number(hhOrdinaryMaleSum));
    setHhOrdinaryFemale(Number(hhOrdinaryFemaleSum));
    setHhSingleMale(Number(hhSingleMaleSum));
    setHhSingleFemale(Number(hhSingleFemaleSum));
  }

  useEffect(() => {
    const fetchEnumData = async () => {
      const result = await axios.get('https://www.ris.gov.tw/rs-opendata/api/Main/docs/v1');
      setYearsEnum(result.data?.paths['/ODRP019/{yyy}']?.get?.parameters[0]?.enum?.reverse());
    };

    fetchEnumData();
  }, []);

  useEffect(() => {
    const fetchInitData = async () => {
      const res = await axios.get('https://www.ris.gov.tw/rs-opendata/api/v1/datastore/ODRP019/110?');
      setTotalPages(res.data.totalPage);
      setData(res.data.responseData);
    };

    fetchInitData();
  }, []);

  useEffect(() => {
    if (!data?.length) return;
    const countiesAndTownsDS = extractCountyTown(getCountyTownStrings(data));
    setCountiesAndTowns(countiesAndTownsDS);
  }, [data]);

  useEffect(() => {
    if (!totalPages) return;
    const promises = [];
    for (let i = 2; i <= totalPages; i += 1) {
      const res = axios.get(`https://www.ris.gov.tw/rs-opendata/api/v1/datastore/ODRP019/110?PAGE=${i}`);
      promises.push(res);
    }
    Promise.all(promises).then((result) => {
      result.forEach((res) => {
        setData((prevState) => [...prevState, ...res.data.responseData]);
      });
    });
  }, [totalPages]);

  const optionsLineChart = {
    title: {
      text: '人口數統計',
    },
    chart: {
      type: 'column',
    },
    xAxis: {
      categories: [
        '共同生活',
        '獨立生活',
      ],
      crosshair: true,
    },
    yAxis: {
      min: 0,
      title: {
        text: '數量',
      },
    },
    plotOptions: {
      column: {
        pointPadding: 0.3,
        borderWidth: 0,
      },
    },
    series: [{
      name: '男性',
      data: [hhOrdinaryMale ?? 0, hhSingleMale ?? 0],

    }, {
      name: '女性',
      data: [hhOrdinaryFemale ?? 0, hhSingleFemale ?? 0],

    }],
  };

  const optionsPieChart = {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie',
    },
    title: {
      text: '戶數統計',
      align: 'center',
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.2f}%</b>',
    },
    accessibility: {
      point: {
        valueSuffix: '%',
      },
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f} %',
        },
      },
    },
    series: [{
      name: 'Brands',
      colorByPoint: true,
      data: [{
        name: '共同生活',
        y: hhOrdinaryFemale ?? 0 + hhOrdinaryMale ?? 0,
        sliced: true,
        selected: true,
      }, {
        name: '獨立生活',
        y: hhSingleMale ?? 0 + hhSingleFemale ?? 0,
        sliced: true,
        selected: true,
      }],
    }],
  };

  return (
    <>
      <div className="header">
        <span>LOGO</span>
        <div className="settings-icon">
          <img src={SettingsIcon} alt="settings-icon" />
        </div>
      </div>
      <h3 className="taiwan-logo">TAIWAN</h3>
      <div className="wrapper">
        <div className="main-title">人口數、戶數按戶別及性別統計</div>
        <form onSubmit={handleSubmit}>
          <select name="year" id="year-select" onChange={handleYearChange}>
            <option value="">Please choose a year</option>
            {yearsEnum.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select name="county" id="county-select" onChange={handleCountyChange} disabled={!selectedYear}>
            <option value="">Please choose a county</option>
            {countiesAndTowns.map((countyAndTowns) => (
              <option key={countyAndTowns.county} value={countyAndTowns.county}>
                {countyAndTowns.county}
              </option>
            ))}
          </select>
          <select name="town" id="town-select" onChange={handleTownChange} disabled={!selectedCounty}>
            <option value="">Please choose a town</option>
            {countiesAndTowns.find((c) => selectedCounty === c.county)?.towns.map((town) => (
              <option key={town} value={town}>{town}</option>
            ))}
          </select>
          <button type="submit" disabled={!selectedYear || !selectedCounty || !selectedTown}>
            Submit
          </button>
        </form>
        {showCharts && (
          <HighchartsReact
            highcharts={Highcharts}
            options={optionsLineChart}
          />
        )}
        {showCharts && (
          <HighchartsReact
            highcharts={Highcharts}
            options={optionsPieChart}
          />
        )}
      </div>
    </>
  );
}

export default App;
