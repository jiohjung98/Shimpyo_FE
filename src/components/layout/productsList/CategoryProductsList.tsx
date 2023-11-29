import { css } from '@emotion/react';
import { useInfiniteQuery } from 'react-query';
import { useEffect, useRef, useState } from 'react';
import ColumnList from './ColumnList';
import useProductsData from '../../../hooks/useProductsData';
import { ResponseProductsData } from '../../../types';

type PropsType = {
  category: string;
};

const CategoryProductsList = ({ category }: PropsType) => {
  const [isEnd, setIsEnd] = useState(false);
  const obsRef = useRef(null);

  const { data, fetchNextPage } = useInfiniteQuery<
  unknown,
  unknown,
  ResponseProductsData[]
  >(
    category,
    ({ pageParam = 0 }) => {
      return getData(pageParam);
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 100000,
      getNextPageParam: (pageParam, allPage) => {
        if (!allPage) {
          return pageParam;
        }
        return allPage.length;
      },
    },
  );

  useEffect(() => {
    const io = new IntersectionObserver(obsHandler, {
      threshold: 1,
    });
    if (obsRef.current) {
      io.observe(obsRef.current);
    }
    return () => {
      io.disconnect();
    };
  }, []);

  const obsHandler = async (entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    console.log(1);
    if (target.isIntersecting && !isEnd) {
      fetchNextPage();
    }
  };

  const getData = async (pageParam: number) => {
    try {
      const fetchData = await useProductsData(pageParam, 8, category);
      if (fetchData) {
        if (fetchData.length < 8) {
          setIsEnd(true);
        }
        return fetchData;
      }
    } catch (error) {
      console.log(error);
    }
    return undefined;
  };

  return (
    <div css={PageBox}>
      <div css={ListBox}>
        <div css={CategoryNameBox}>
          <h2 css={CategoryName}>
            {category === 'hot' && '인기 숙소'}
            {category === '펜션,풀빌라' && '펜션, 풀빌라'}
            {category === '호텔,모텔' && '호텔, 모텔'}
          </h2>
          <p css={CategoryDesc}>
            {category === 'hot' && '가장 잘 나가는 숙소 추천'}
            {category === '펜션,풀빌라' && '크리스마스 펜션 예약하기'}
            {category === '호텔,모텔' && '지금 떠나는 도심 호캉스!'}
          </p>
        </div>
        {data && data.pages && (
          <ColumnList category={category} data={data.pages.flat()} />
        )}
        {!isEnd && <div ref={obsRef} css={spinner} />}
      </div>
    </div>
  );
};

export default CategoryProductsList;

const PageBox = css`
  display: flex;
  justify-content: center;
`;

const ListBox = css`
  width: 68.75rem;

  display: flex;
  flex-direction: column;

  padding: 3.125rem 0;
  gap: 3rem;
`;

const CategoryNameBox = css`
  height: 6rem;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const CategoryName = css`
  font-size: 3rem;
  font-weight: 700;
`;

const CategoryDesc = css`
  font-size: 1.5rem;
  font-weight: 400;
`;

const spinner = css`
  height: 0;

  background-color: aqua;
`;
