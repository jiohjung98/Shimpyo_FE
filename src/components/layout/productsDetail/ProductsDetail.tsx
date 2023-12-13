/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/indent */
/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable @typescript-eslint/no-shadow */
import { css } from '@emotion/react';
import { SetStateAction, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AiOutlineShoppingCart } from 'react-icons/ai';
import { format } from 'date-fns';
import Modal from 'react-modal';
import { useSetRecoilState } from 'recoil';
import { cartDataState } from '../../../atoms/cartAtom';
import { axiosWithNoToken } from '../../../Axios';
import theme from '../../../style/theme';
import {
  PostRoomToCart,
  RequestProductDetail,
  Room,
  RoomData,
} from '../../../types';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import CalendarComponent from './Calendar';
import PeopleSelector from './PeopleSelector';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { loadingAtom } from '../../../atoms/loading';
import Star from '../../common/star';
import LocationWithCustomOverlay from './LocationWithCustomOverlay';
import ImageSlider from './ImageSlider';
import useCart from '../../../hooks/useCart';
import { cartPostToJudgment } from '../../../api/cart';
import { useLocationData } from '../../../api/productsList';
import RoomImageSlider from './RoomImageSlider';
import ProductAmenities from './ProductAmenities';

const ProductsDetail = () => {
  const navigate = useNavigate();

  const { cartPostMutation } = useCart();

  const [productDetail, setProductDetail] =
    useState<RequestProductDetail | null>(null);

  const [count, setCount] = useState(2);

  const { productId } = useParams();

  const [nights, setNights] = useState(1);

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);

  const [defaultDate, setDefaultDate] = useState(format(today, 'yyyy-MM-dd'));
  const [defaultDatePlusDay, setDefaultDatePlusDay] = useState(
    format(tomorrow, 'yyyy-MM-dd'),
  );

  const setLoading = useSetRecoilState(loadingAtom);

  // 선택한 숙박일 수 부모 컴포넌트 상태에 업데이트
  const handleSetNights = (selectedNights: SetStateAction<number>) => {
    setNights(selectedNights);
  };

  const [enterDate, setEnterDate] = useState('');
  const [exitDate, setExitDate] = useState('');

  // 캘린더에서 날짜 선택했을 때 로직(입실날짜 및 퇴실날짜 설정)
  const handleEnterExitDatesChange = (enterDate: string, exitDate: string) => {
    setEnterDate(enterDate);
    setExitDate(exitDate);

    const startDateFormatted = format(new Date(enterDate), 'yyyy-MM-dd');
    const endDateFormatted = format(new Date(exitDate), 'yyyy-MM-dd');

    setDefaultDate(startDateFormatted);
    setDefaultDatePlusDay(endDateFormatted);
  };

  useEffect(() => {
    const fetchDataProductDetail = async ({
      startDate,
      endDate,
    }: Pick<RequestProductDetail, 'startDate' | 'endDate'>) => {
      try {
        setLoading({ isLoading: true, message: '방 정보를 조회중입니다.' });
        // if (!startDate || !endDate) return;
        const response = await axiosWithNoToken.get(
          `/api/products/${productId}?startDate=${startDate}&endDate=${endDate}`,
        );
        setProductDetail(response.data.data);

        console.log(response.data.data);
      } catch (error) {
        console.error('Error fetching product detail:', error);
      } finally {
        setLoading({ isLoading: false, message: '' });
      }
    };

    fetchDataProductDetail({
      startDate: enterDate || defaultDate,
      endDate: exitDate || defaultDatePlusDay,
    });
  }, [enterDate, exitDate]);

  // 모달 떠있을 때 헤더 컴포넌트 클릭하거나 뒤로가기 눌러서 페이지 이동 시 스크롤 다시 허용
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'visible';
    };
  }, [navigate]);

  // 장바구니에 같은 객체 있을 때 렌더링하는 모달
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const openModal = () => {
    Modal.setAppElement('#root');
    setModalIsOpen(true);
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    setModalIsOpen(false);
    document.body.style.overflow = 'visible';
  };

  const [modalCartIsOpen, setModalCartIsOpen] = useState(false);
  const openCartModal = () => {
    Modal.setAppElement('#root');
    setModalCartIsOpen(true);
    document.body.style.overflow = 'hidden';
  };
  const closeCartModal = () => {
    setModalCartIsOpen(false);
    document.body.style.overflow = 'visible';
  };

  const handleModalContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.classList.contains('modal-container')) {
      closeModal();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  // 장바구니 로직
  const addToCart = async (product: RequestProductDetail, room: Room) => {
    if (!product || !room) {
      console.error('Product or room information is missing');
      return;
    }

    const requestData: PostRoomToCart = {
      roomCode: room.roomCode,
      price: parseFloat(`${room.price}`) * nights,
      startDate: defaultDate,
      endDate: defaultDatePlusDay,
    };

    try {
      const existingCartItems = localStorage.getItem('cartItems');
      const cartItems = existingCartItems ? JSON.parse(existingCartItems) : [];

      // 날짜 범위
      const newItemRange = {
        startDate: defaultDate,
        endDate: defaultDatePlusDay,
      };

      // 중복 여부 확인
      const isOverlapping = cartItems.some(
        (item: { startDate: string; endDate: string; roomCode: number }) => {
          // 기존 장바구니 아이템의 날짜 범위
          const existingItemRange = {
            startDate: item.startDate,
            endDate: item.endDate,
          };

          // 날짜 범위 겹치는지 확인
          return (
            item.roomCode === room.roomCode &&
            newItemRange.startDate < existingItemRange.endDate &&
            newItemRange.endDate > existingItemRange.startDate
          );
        },
      );

      if (isOverlapping) {
        openModal();
      } else {
        cartItems.push(requestData);
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        await cartPostMutation.mutate(requestData);
        openCartModal();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const setCartData = useSetRecoilState(cartDataState);

  const reservation = async (rooms: RoomData[], roomInfo: Room) => {
    try {
      setLoading({ isLoading: true, message: '현재 예약중입니다.' });

      const requestData = {
        roomCode: roomInfo.roomCode,
        // roomName: roomInfo.roomName,
        // productName: roomInfo.roomName,
        startDate: defaultDate,
        endDate: defaultDatePlusDay,
        // standard: roomInfo.standard,
        // capacity: roomInfo.capacity,
        // checkIn: roomInfo.checkIn,
        // checkOut: roomInfo.checkOut,
        // price: parseFloat(`${roomInfo.price}`) * nights,
      };

      setCartData(() => [requestData]);
      await cartPostToJudgment(rooms);
      navigate('/pay');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  };

  if (!productDetail) {
    return <div>Loading...</div>;
  }

  if (!productDetail || !productDetail.images) {
    return <div>Loading...</div>;
  }

  const handleShowNearbyClick = async () => {
    try {
      const location = productDetail.address.address.split(' ')[0];
      console.log(location);

      const fetchData = await useLocationData(location);

      console.log('주변 숙소 데이터:', fetchData);
    } catch (error) {
      console.error('주변 숙소 데이터 불러오기 에러:', error);
    }
  };

  return (
    <div>
      <div css={ProductDetailContainer}>
        <ImageSlider images={productDetail.images} />
        <div css={ProductDetailBox}>
          <div css={ProductData}>
            <div css={NameScoreContainer}>
              <div css={ProductName}>{productDetail.productName}</div>
              <div css={ProductScore}>
                <Star />
                {productDetail.starAvg.toFixed(1)}
              </div>
            </div>
            <div css={ProductsLocation}>{productDetail.address.address}</div>
            <div css={productsInfoCenter}>
              Tel: {productDetail.productOptionResponse.infoCenter}
            </div>
            <button
              type="button"
              css={ProductsDetailInfo}
              onClick={handleShowNearbyClick}
            >
              주변 숙소 보기
            </button>
          </div>
        </div>
        <div>
          {productDetail && (
            <LocationWithCustomOverlay
              address={productDetail.address.address}
              productName={productDetail.productName}
              images={productDetail.images}
            />
          )}
        </div>
        <div css={OptionSelector}>
          <div css={[DayCalendar, Divider]}>
            <CalendarComponent
              setNights={handleSetNights}
              onEnterExitDatesChange={handleEnterExitDatesChange}
            />
          </div>
          <div css={PeopleCount}>
            <PeopleSelector count={count} setCount={setCount} />
          </div>
        </div>
        <div css={RoomContainer}>
          {productDetail.rooms.map((room) => (
            <div key={`room ${room.roomCode}`} css={RoomItem}>
              <div css={RoomImg}>
                <RoomImageSlider images={room.roomImages} />
              </div>
              <div css={RoomInfo}>
                <div css={RoomName}>{room.roomName}</div>
                <div
                  css={RoomCount}
                >{`기준 ${room.standard}인 / 최대 ${room.capacity}인`}</div>
                <div css={RoomDesc}>{room.description}</div>
                <div css={checkTime}>
                  {`체크인: ${room.checkIn} ~ 체크아웃: ${room.checkOut}`}
                </div>
                <div css={peoplePlusText}>
                  기준 인원 초과 시, 추가요금이 발생할 수 있습니다.
                </div>
                <div css={RoomDesc}>남은 객실 {room.remaining}개</div>
              </div>
              <div css={RoomAction}>
                <div css={priceStyle}>
                  {parseFloat(room.price) === 0
                    ? (100000 * nights).toLocaleString('ko-KR', {
                        style: 'currency',
                        currency: 'KRW',
                      })
                    : (parseFloat(room.price) * nights).toLocaleString(
                        'ko-KR',
                        { style: 'currency', currency: 'KRW' },
                      )}
                </div>
                <div css={buyBtn}>
                  {room.remaining === 0 ? (
                    <>
                      <AiOutlineShoppingCart css={NoCartIcon} />
                      <button type="button" css={exceedText}>
                        예약마감
                      </button>
                    </>
                  ) : (
                    <>
                      {count <= room.capacity ? (
                        <>
                          <AiOutlineShoppingCart
                            css={CartIcon}
                            onClick={() => addToCart(productDetail, room)}
                          />
                          <button
                            type="button"
                            css={reservationButton}
                            onClick={() =>
                              reservation(
                                [
                                  {
                                    roomCode: room.roomCode,
                                    startDate: defaultDate,
                                    endDate: defaultDatePlusDay,
                                  },
                                ],
                                room,
                              )
                            }
                          >
                            예약하기
                          </button>
                        </>
                      ) : (
                        <>
                          <AiOutlineShoppingCart css={NoCartIcon} />{' '}
                          <button type="button" css={exceedText}>
                            인원초과
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div css={ProductsDetailInfo}>숙소 소개</div>
          <div>
            <div css={ProductsIntroduce}>{productDetail.description}</div>
          </div>
          <ProductAmenities productDetail={productDetail} />
        </div>
        {modalIsOpen && (
          <div
            className="modal-container"
            onClick={handleModalContainerClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
          >
            <Modal
              css={modalStyle}
              isOpen={modalIsOpen}
              onRequestClose={closeModal}
              contentLabel="장바구니 안내"
              shouldCloseOnOverlayClick={false}
            >
              <div css={modalText1}>장바구니 안내</div>
              <div css={modalTextContainer}>
                <div css={modalText2}>
                  해당 날짜를 포함하는 상품이 이미 장바구니에 있습니다.
                </div>
                <div css={modalText3}>장바구니를 확인해주세요.</div>
              </div>
              <button css={modalBtn} type="button" onClick={closeModal}>
                닫기
              </button>
            </Modal>
          </div>
        )}
        {modalCartIsOpen && (
          <div
            className="modal-container"
            onClick={handleModalContainerClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
          >
            <Modal
              css={modalStyle}
              isOpen={modalCartIsOpen}
              onRequestClose={closeCartModal}
              contentLabel="장바구니 안내"
              shouldCloseOnOverlayClick={false}
            >
              <div css={modalText1}>장바구니 안내</div>
              <div css={modalTextContainer}>
                <div css={modalText2}>장바구니에 상품이 담겼습니다.</div>
                <div css={modalText3}>장바구니를 확인해주세요.</div>
              </div>
              <button css={modalBtn} type="button" onClick={closeCartModal}>
                닫기
              </button>
            </Modal>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsDetail;

const ProductDetailContainer = css`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;
  min-height: calc(100vh - 70px);
`;

const ProductDetailBox = css`
  width: 100%;
  display: flex;
  gap: 1.25rem;
  margin-top: 3rem;
`;

const ProductData = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
`;
const NameScoreContainer = css`
  display: flex;
  justify-content: space-between;
  width: 95%;
  align-items: center;
  font-size: 0.875rem;
`;

const ProductScore = css`
  display: flex;
  /* margin-left: auto; */
  font-size: 1.875rem;
  font-weight: bold;
  /* width: 6.25rem; */
`;

const ProductName = css`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  font-size: 3rem;
  font-weight: 600;
`;
const ProductsLocation = css`
  width: 95%;
  display: flex;
  justify-content: flex-start;
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1.5rem;
`;

const productsInfoCenter = css`
  width: 95%;
  display: flex;
  font-size: 1.3rem;
`;

const ProductsIntroduce = css`
  display: flex;
  width: 95%;
  margin-left: auto;
  margin-right: auto;
  font-size: 1.3rem;
  font-weight: 500;
  margin-bottom: 2rem;
`;

const ProductsDetailInfo = css`
  width: 95%;
  display: flex;
  justify-content: flex-start;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  margin-top: 4rem;
  margin-left: auto;
  margin-right: auto;
`;

const OptionSelector = css`
  display: flex;
  width: 100%;
  background-color: ${theme.colors.white};
  border: 1px solid #ccc;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  margin-top: 2rem;
`;

const Divider = css`
  border-right: 0.0625rem solid #ccc;
`;

const DayCalendar = css`
  flex: 1;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-left: 0.5rem;
`;
const PeopleCount = css`
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0.625rem 0.625rem;
`;

const RoomContainer = css`
  display: flex;
  label: 'room';
  flex-direction: column;
  width: 80rem;
`;

const RoomItem = css`
  display: flex;
  padding: 20px;
  padding: 1.25rem;
  border: 1px solid #e5e9ed;
  background-color: ${theme.colors.white};
  width: 80rem;
  height: 25rem;
`;

const RoomImg = css`
  width: 35%;
  border-radius: 0.625rem;
  box-shadow: 0rem 0.25rem 0.25rem 0rem rgba(0, 0, 0, 0.25);
`;

const RoomInfo = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.625rem;
  margin-left: 1.25rem;
  font-weight: bold;
`;

const RoomName = css`
  font-size: 2.25rem;
`;

const RoomCount = css`
  font-size: 1.5rem;
`;

const RoomDesc = css`
  font-size: 1.25rem;
`;

const checkTime = css`
  font-size: 1.25rem;
`;

const peoplePlusText = css`
  font-size: 0.875rem;
  color: ${theme.colors.gray600};
`;

const RoomAction = css`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: auto;
  padding: 0.625rem;
`;

const priceStyle = css`
  align-self: flex-end;
  margin-bottom: 0.625rem;
  font-size: 1.875rem;
`;

const buyBtn = css`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  margin-top: auto;
`;

const CartIcon = css`
  width: 2.5rem;
  height: 2.5rem;
  color: ${theme.colors.blue500};
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  &:hover {
    color: ${theme.colors.blue700};
  }
  margin-right: 2rem;
`;

const NoCartIcon = css`
  width: 2.5rem;
  height: 2.5rem;
  color: ${theme.colors.gray500};
  cursor: not-allowed;
  margin-right: 2rem;
`;

const reservationButton = css`
  padding: 0.625rem 1.25rem;
  background-color: ${theme.colors.blue700};
  color: white;
  border: none;
  border-radius: 0.3125rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 1rem;
  outline: none;
  &:hover {
    background-color: ${theme.colors.blue800};
  }
  &:active {
    transform: translateY(1px);
  }
`;

const exceedText = css`
  padding: 0.625rem 1.25rem;
  background-color: ${theme.colors.gray500};
  color: white;
  border: none;
  border-radius: 0.3125rem;
  cursor: not-allowed;
  transition: background-color 0.3s ease;
  font-size: 1rem;
  outline: none;
`;

const modalStyle = css`
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30rem;
  height: 15.625rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  padding: 1.25rem;
  background-color: white;
  z-index: 1000;
`;

const modalTextContainer = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  margin-right: 2rem;
  margin-left: 2rem;
`;

const modalText1 = css`
  font-size: 1.25rem;
  font-weight: bold;
  margin-right: auto;
  margin-left: auto;
  margin-top: 0.625rem;
  white-space: nowrap;
`;

const modalText2 = css`
  text-align: center;
  margin-bottom: 0.625rem;
  white-space: nowrap;
`;

const modalText3 = css`
  text-align: center;
  margin-top: 0.625rem;
  white-space: nowrap;
`;

const modalBtn = css`
  padding: 0.5rem 1rem;
  background-color: ${theme.colors.blue600};
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  &:hover {
    background-color: ${theme.colors.blue800};
  }
`;
