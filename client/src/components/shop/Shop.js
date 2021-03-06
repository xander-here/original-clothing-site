import React, { useState, useEffect, useCallback } from "react";
import "./Shop.css";
import axios from "axios";
import Filter from "./subComponents/filter/Filter";
import ShopItem from "./subComponents/ShopItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useHistory } from "react-router-dom";

function Shop({ title, link }) {
  const history = useHistory();

  // state for all items from server
  const [items, setItems] = useState([]);
  const [itemsCount, setItemsCount] = useState(0);

  // getting colors and sizes from server on page load
  const [itemStock, setItemStock] = useState({
    colors: [],
    sizes: [],
  });

  // changing all product images based on color
  const [stockIndex, setStockIndex] = useState({});
  const [page, setPage] = useState(0);
  const limit = 12;

  // state for filter
  const [filter, setFilter] = useState({
    sort: "",
    color: [],
    size: [],
  });

  // hide filter on click
  const [hideFilter, setHideFilter] = useState({
    sort: true,
    color: true,
    size: true,
  });

  const [lastClicked, setLastClicked] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [blackBox, setBlackBox] = useState(false);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [PaginateLoading, setPaginateLoading] = useState(false);

  const [update, setUpdate] = useState(0);

  useEffect(() => {
    document.title = `${title} | Stand Out`;
  }, [title]);

  useEffect(() => {
    if (window.innerWidth >= 1000 && showFilters) {
      setBlackBox(false);
      setShowFilters(false);
    }
  }, [windowWidth, showFilters]);

  const resizeEvent = useCallback(() => {
    setWindowWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", resizeEvent);

    return () => {
      window.removeEventListener("resize", resizeEvent);
    };
  }, [resizeEvent]);

  const reset = useCallback(() => {
    if (itemStock.colors.length > 0) {
      setPage(0);
      setHideFilter({
        sort: true,
        color: true,
        size: true,
      });
      setFilter({
        sort: "",
        color: [],
        size: [],
      });
      setLastClicked("");
      setUpdate((prev) => prev + 1);
    }
  }, [itemStock]);

  useEffect(reset, [link]);

  //getting items from server
  const getItems = useCallback(() => {
    setItems([]);
    axios
      .get(
        `/product/${link}?page=${1}&limit=${limit}&sort=${filter.sort}&color=${
          filter.color
        }&size=${filter.size}`
      )
      .then((res) => {
        if (res.status !== 200) {
          throw new Error();
        }
        const { count, products } = res.data;

        setItemsCount(count);
        setStockIndex((prev) => {
          let obj = {};
          for (let i = 0; i < products.length; i++) {
            obj[i] = 0;
          }
          return obj;
        });

        setItems(products);
        setPage(1);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [filter, link]);

  const getFilters = useCallback(() => {
    axios
      .get(
        `/product/filter/${link}?&color=${filter.color}&size=${filter.size}&filter=${lastClicked}`
      )
      .then((res) => {
        setFilter((prev) => {
          Object.keys(res.data).forEach((el) => {
            if (el === "sizes") {
              prev.size = prev.size.filter((k) => res.data[el].includes(k));
            } else if (el === "colors") {
              prev.color = prev.color.filter((k) =>
                res.data[el].includes("#" + k)
              );
            }
          });

          return prev;
        });
        setItemStock((prev) => {
          return {
            ...prev,
            ...res.data,
          };
        });
        getItems();
      })
      .catch((err) => {
        history.push("/404");
        console.log(err);
      });
  }, [filter, lastClicked, history, link, getItems]);

  useEffect(getFilters, [update]);

  const pagination = () => {
    setPaginateLoading(true);
    axios
      .get(
        `/product/${link}/?page=${page + 1}&limit=${limit}&sort=${
          filter.sort
        }&color=${filter.color}&size=${filter.size}`
      )
      .then((res) => {
        const { count, products } = res.data;
        setItemsCount(count);

        setStockIndex((prev) => {
          let obj = { ...prev };
          for (let i = 0; i < products.length; i++) {
            obj[i + page * limit] = 0;
          }
          return obj;
        });
        setItems((prev) => prev.concat(products));
        setPage((prev) => prev + 1);
        setPaginateLoading(false);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const limitArr = () => {
    let arr = [];
    for (var i = 0; i < limit; i++) {
      arr.push(i);
    }
    return arr;
  };

  return (
    <div className="shop">
      <Filter
        {...{
          filter,
          setFilter,
          itemStock,
          hideFilter,
          setHideFilter,
          showFilters,
          setShowFilters,
          setBlackBox,
          setLastClicked,
          setUpdate,
        }}
      />
      <div className="shop__items-container">
        <div className="shop__items-container__title">
          <h1>{title}</h1>
          <p
            onClick={() => {
              setShowFilters((prev) => !prev);
              setBlackBox((prev) => !prev);
            }}
          >
            filter
            <FontAwesomeIcon className="icon" icon="chevron-right" />
          </p>
        </div>
        {items.length <= 0 ? (
          <div className="shop__loading__box">
            {limitArr().map((index) => (
              <div
                key={index}
                className="shop__loading__container shop__loading__container--item"
              >
                <div className="shop__loading__container__img"></div>
                <div className="shop__loading__container__text shop__loading__container__text--name"></div>
                <div className="shop__loading__container__text"></div>
                <div className="shop__loading__container__text"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="shop__items-container__items">
            {items.map((el, index) => (
              <ShopItem
                key={index}
                {...{ el, stockIndex, index, setStockIndex }}
              />
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div>
            <p className="shop__items-container__count">
              {page * limit < itemsCount
                ? `${page * limit}/${itemsCount} products`
                : `${itemsCount}/${itemsCount} products`}
            </p>
            {page * limit < itemsCount && (
              <button
                className={
                  PaginateLoading
                    ? "shop__items-container__load-more shop__items-container__load-more--loading"
                    : "shop__items-container__load-more"
                }
                type="button"
                onClick={() => {
                  if (!PaginateLoading) {
                    pagination();
                  }
                }}
              >
                {PaginateLoading ? (
                  <div className="shop__items-container__load-more__loading"></div>
                ) : (
                  "load more"
                )}
              </button>
            )}
          </div>
        )}
      </div>
      <div
        className={
          blackBox
            ? "shop__black-box shop__black-box--visible"
            : "shop__black-box"
        }
        onClick={() => {
          setShowFilters(false);
          setBlackBox(false);
        }}
      ></div>
    </div>
  );
}

export default Shop;
