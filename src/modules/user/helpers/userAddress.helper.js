function formatAddressResponse(address, userName) {
  return {
    id: address.id,
    userName,
    addressDetail: address.addressDetail,
    isPrimary: address.isPrimary,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
    village: {
      id: address.village.id,
      name: address.village.name,
      district: {
        id: address.village.district.id,
        name: address.village.district.name,
        regency: {
          id: address.village.district.regency.id,
          name: address.village.district.regency.name,
          province: {
            id: address.village.district.regency.province.id,
            name: address.village.district.regency.province.name,
          },
        },
      },
    },
  };
}

module.exports = { formatAddressResponse };
